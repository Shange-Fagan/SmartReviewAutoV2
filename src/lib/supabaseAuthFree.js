import { supabase } from './supabase'

// Auth-free widget creation
export const createWidgetNoAuth = async (widgetData) => {
  try {
    const { data, error } = await supabase
      .rpc('create_widget_no_auth', {
        widget_name: widgetData.name || 'Review Widget',
        widget_title: widgetData.title || 'How was your experience?',
        widget_subtitle: widgetData.subtitle || 'We\'d love to hear your feedback!'
      })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating widget:', error)
    return { data: null, error }
  }
}

// Auth-free widget fetching
export const getWidgetsNoAuth = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_widgets')
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching widgets:', error)
    return { data: null, error }
  }
}

// Auth-free widget updating
export const updateWidgetNoAuth = async (widgetId, widgetData) => {
  try {
    const { data, error } = await supabase
      .rpc('update_widget_no_auth', {
        widget_id: widgetId,
        widget_name: widgetData.name || 'Review Widget',
        widget_title: widgetData.title || 'How was your experience?',
        widget_subtitle: widgetData.subtitle || 'We\'d love to hear your feedback!',
        widget_theme: widgetData.theme || 'light',
        widget_colors: widgetData.colors || {
          primary: '#007cba',
          secondary: '#f8f9fa',
          text: '#333333'
        }
      })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating widget:', error)
    return { data: null, error }
  }
}

// Auth-free widget deletion
export const deleteWidgetNoAuth = async (widgetId) => {
  try {
    const { data, error } = await supabase
      .rpc('delete_widget_no_auth', {
        widget_id: widgetId
      })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting widget:', error)
    return { data: null, error }
  }
}

// Direct table access (bypasses RLS)
export const getWidgetsDirectly = async () => {
  try {
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching widgets directly:', error)
    return { data: null, error }
  }
}

// Direct widget creation (bypasses RLS)
export const createWidgetDirectly = async (widgetData) => {
  try {
    const { data, error } = await supabase
      .from('widgets')
      .insert([{
        business_id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: widgetData.name || 'Review Widget',
        title: widgetData.title || 'How was your experience?',
        subtitle: widgetData.subtitle || 'We\'d love to hear your feedback!',
        theme: widgetData.theme || 'light',
        position: widgetData.position || 'bottom-right',
        show_after: widgetData.show_after || 5000,
        button_text: widgetData.button_text || 'Leave a Review',
        colors: widgetData.colors || {
          primary: '#007cba',
          secondary: '#f8f9fa',
          text: '#333333'
        },
        widget_code: Math.random().toString(36).substring(2, 10),
        is_active: true
      }])
      .select()
    
    if (error) throw error
    return { data: data[0], error: null }
  } catch (error) {
    console.error('Error creating widget directly:', error)
    return { data: null, error }
  }
}

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('widgets')
      .select('count')
      .limit(1)
    
    if (error) throw error
    return { connected: true, error: null }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { connected: false, error }
  }
}