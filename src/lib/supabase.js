import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============= AUTH FUNCTIONS =============
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const updateUserProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  return { data, error }
}

export const updateUserPassword = async (password) => {
  const { data, error } = await supabase.auth.updateUser({
    password
  })
  return { data, error }
}

export const deleteUserAccount = async () => {
  // First get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'No user found' } }

  try {
    // Call the Netlify function to delete the user account
    const response = await fetch('/.netlify/functions/delete-user-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete account')
    }

    return { error: null }
  } catch (error) {
    console.error('Account deletion error:', error)
    return { error }
  }
}

// ============= BUSINESS FUNCTIONS =============
export const createBusiness = async (businessData) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert([businessData])
    .select()
  return { data, error }
}

export const getBusiness = async (userId) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const updateBusiness = async (businessId, updates) => {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
  return { data, error }
}

// ============= REVIEW FUNCTIONS =============
export const createReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewData])
    .select()
  return { data, error }
}

export const getReviews = async (businessId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateReview = async (reviewId, updates) => {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
  return { data, error }
}

export const deleteReview = async (id) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
  return { error }
}

// ============= REVIEW REQUEST FUNCTIONS =============
export const createReviewRequest = async (requestData) => {
  const { data, error } = await supabase
    .from('review_requests')
    .insert([requestData])
    .select()
  return { data, error }
}

export const getReviewRequests = async (businessId) => {
  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      *,
      reviews!inner (
        id,
        title,
        content,
        rating,
        status,
        created_at
      )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateReviewRequest = async (requestId, updates) => {
  const { data, error } = await supabase
    .from('review_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
  return { data, error }
}

// ============= WIDGET FUNCTIONS =============
export const createWidget = async (widgetData) => {
  // Generate unique widget code
  const widgetCode = `widget_${Math.random().toString(36).substring(2, 15)}`
  
  const { data, error } = await supabase
    .from('widgets')
    .insert([{
      ...widgetData,
      widget_code: widgetCode
    }])
    .select()
  return { data, error }
}

export const getWidgets = async (businessId) => {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateWidget = async (widgetId, updates) => {
  const { data, error } = await supabase
    .from('widgets')
    .update(updates)
    .eq('id', widgetId)
    .select()
  return { data, error }
}

export const deleteWidget = async (widgetId) => {
  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', widgetId)
  return { error }
}

export const getWidgetByCode = async (widgetCode) => {
  const { data, error } = await supabase
    .from('widgets')
    .select(`
      *,
      businesses (
        name,
        industry,
        google_place_id,
        yelp_business_id
      )
    `)
    .eq('widget_code', widgetCode)
    .eq('is_active', true)
    .single()
  return { data, error }
}

// ============= ANALYTICS FUNCTIONS =============
export const getAnalytics = async (businessId, dateRange = '30d') => {
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', getDateRangeStart(dateRange))
    .order('date', { ascending: false })
  return { data, error }
}

export const createAnalyticsEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('analytics')
    .insert([eventData])
    .select()
  return { data, error }
}

// ============= SUBSCRIPTION FUNCTIONS =============
export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

export const createSubscription = async (subscriptionData) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
  return { data, error }
}

export const updateSubscription = async (subscriptionId, updates) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
  return { data, error }
}

export const getUserPayPalSubscriptionId = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('paypal_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

// ============= HELPER FUNCTIONS =============
function getDateRangeStart(range) {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

// ============= WIDGET GENERATION FUNCTIONS =============
export const generateWidgetCode = (widget) => {
  const baseUrl = window.location.origin
  
  return `
<!-- Smart Review Widget -->
<div id="smart-review-widget-${widget.widget_code}"></div>
<script>
(function() {
  const widgetConfig = ${JSON.stringify(widget)};
  const widgetId = '${widget.widget_code}';
  
  // Create widget container
  const container = document.getElementById('smart-review-widget-' + widgetId);
  if (!container) return;
  
  // Create widget HTML
  const widgetHTML = \`
    <div style="
      position: fixed;
      ${widget.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
      ${widget.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
      ${widget.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
      ${widget.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
      z-index: 9999;
      background: ${widget.colors.primary};
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    " onclick="openReviewModal()">
      \${widgetConfig.button_text}
    </div>
    
    <div id="review-modal-\${widgetId}" style="
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h3 style="margin-top: 0; color: #333;">\${widgetConfig.title}</h3>
        <p style="color: #666; margin-bottom: 20px;">\${widgetConfig.subtitle}</p>
        
        <form id="review-form-\${widgetId}" onsubmit="submitReview(event)">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
            <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
            <input type="email" name="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rating:</label>
            <div id="rating-\${widgetId}" style="font-size: 24px; margin-bottom: 10px;">
              <span onclick="setRating(1)">⭐</span>
              <span onclick="setRating(2)">⭐</span>
              <span onclick="setRating(3)">⭐</span>
              <span onclick="setRating(4)">⭐</span>
              <span onclick="setRating(5)">⭐</span>
            </div>
            <input type="hidden" name="rating" value="5">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Review:</label>
            <textarea name="review" required rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
          </div>
          
          <div style="text-align: right;">
            <button type="button" onclick="closeReviewModal()" style="
              background: #ccc;
              color: #333;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 10px;
            ">Cancel</button>
            <button type="submit" style="
              background: \${widgetConfig.colors.primary};
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
            ">Submit Review</button>
          </div>
        </form>
      </div>
    </div>
  \`;
  
  container.innerHTML = widgetHTML;
  
  // Show widget after delay
  setTimeout(() => {
    const widget = document.querySelector('[id^="smart-review-widget-"]');
    if (widget) widget.style.display = 'block';
  }, widgetConfig.show_after || 5000);
  
  // Global functions
  window.openReviewModal = function() {
    const modal = document.getElementById('review-modal-' + widgetId);
    modal.style.display = 'flex';
  };
  
  window.closeReviewModal = function() {
    const modal = document.getElementById('review-modal-' + widgetId);
    modal.style.display = 'none';
  };
  
  window.setRating = function(rating) {
    const stars = document.querySelectorAll('#rating-' + widgetId + ' span');
    const ratingInput = document.querySelector('#review-form-' + widgetId + ' input[name="rating"]');
    
    stars.forEach((star, index) => {
      star.style.opacity = index < rating ? '1' : '0.3';
    });
    
    ratingInput.value = rating;
  };
  
  window.submitReview = function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const reviewData = {
      name: formData.get('name'),
      email: formData.get('email'),
      rating: parseInt(formData.get('rating')),
      review: formData.get('review'),
      widgetId: widgetId
    };
    
    // Submit to your API
    fetch('${baseUrl}/.netlify/functions/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    })
    .then(response => response.json())
    .then(data => {
      alert('Thank you for your review!');
      closeReviewModal();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error submitting review. Please try again.');
    });
  };
})();
</script>
<!-- End Smart Review Widget -->
  `.trim()
}
