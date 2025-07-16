const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { name, email, rating, review, widgetId } = JSON.parse(event.body)

    // Validate input
    if (!name || !email || !rating || !review || !widgetId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: name, email, rating, review, widgetId' 
        })
      }
    }

    if (rating < 1 || rating > 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Rating must be between 1 and 5' 
        })
      }
    }

    // Get widget details
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('id, business_id, name')
      .eq('widget_code', widgetId)
      .eq('is_active', true)
      .single()

    if (widgetError || !widget) {
      console.error('Widget not found:', widgetError)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Widget not found' })
      }
    }

    // Create review
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert([{
        business_id: widget.business_id,
        widget_id: widget.id,
        title: `${rating} star review from ${name}`,
        content: review,
        rating: parseInt(rating),
        customer_name: name,
        customer_email: email,
        status: 'published',
        source: 'widget',
        ip_address: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
        user_agent: event.headers['user-agent'] || 'unknown'
      }])
      .select()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to submit review' })
      }
    }

    // Update widget click count
    await supabase
      .from('widgets')
      .update({ 
        clicks: supabase.sql`clicks + 1` 
      })
      .eq('id', widget.id)

    // Create analytics event
    await supabase
      .from('analytics')
      .insert([{
        business_id: widget.business_id,
        widget_id: widget.id,
        event_type: 'review_submitted',
        event_data: {
          rating,
          widget_name: widget.name,
          customer_name: name
        },
        conversions: 1
      }])

    // Send success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Review submitted successfully',
        reviewId: reviewData[0].id 
      })
    }

  } catch (error) {
    console.error('Submit review error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}