import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createWidget, getWidgets, getAnalytics, createBusiness, getBusiness, updateWidget, deleteWidget, generateWidgetCode } from '../lib/supabase'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'
import { Code, Copy, Settings, BarChart3, Eye, Trash2, Plus, ExternalLink, Palette, Zap, MessageSquare, Star, Users, TrendingUp, Save, X, FileText, Monitor, Smartphone } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [widgets, setWidgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [editingWidget, setEditingWidget] = useState(null)
  const [widgetConfig, setWidgetConfig] = useState({
    name: 'Review Widget',
    title: 'How was your experience?',
    subtitle: 'We\'d love to hear your feedback!',
    theme: 'light',
    position: 'bottom-right',
    show_after: 5000,
    button_text: 'Leave a Review',
    colors: {
      primary: '#007cba',
      secondary: '#f8f9fa',
      text: '#333333'
    }
  })
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalClicks: 0,
    conversionRate: 0,
    averageRating: 0
  })

  useEffect(() => {
    if (user) {
      fetchWidgets()
      fetchAnalytics()
    }
  }, [user])

  const fetchWidgets = async () => {
    try {
      // First ensure user has a business
      let business = await ensureUserHasBusiness()
      if (!business) return
      
      const { data, error } = await getWidgets(business.id)
      if (error) throw error
      setWidgets(data || [])
    } catch (error) {
      console.error('Error fetching widgets:', error)
      toast.error('Failed to load widgets')
      setWidgets([])
    } finally {
      setLoading(false)
    }
  }

  const ensureUserHasBusiness = async () => {
    try {
      // Try to get existing business
      const { data: existingBusiness, error: getError } = await getBusiness(user.id)
      if (existingBusiness && !getError) {
        return existingBusiness
      }
      
      // Create default business if none exists
      const { data: newBusiness, error: createError } = await createBusiness({
        user_id: user.id,
        name: `${user.email?.split('@')[0] || 'My'} Business`,
        email: user.email,
        industry: 'General',
        created_at: new Date().toISOString()
      })
      
      if (createError) {
        console.error('Error creating business:', createError)
        throw new Error('Failed to create business: ' + createError.message)
      }
      
      return newBusiness
    } catch (error) {
      console.error('Error ensuring business:', error)
      toast.error('Failed to set up business')
      throw error
    }
  }

  const fetchAnalytics = async () => {
    try {
      const business = await ensureUserHasBusiness()
      if (!business) return
      
      const { data, error } = await getAnalytics(business.id)
      if (error) throw error
      
      // Calculate analytics from data
      const totalViews = data?.reduce((sum, item) => sum + (item.views || 0), 0) || 0
      const totalClicks = data?.reduce((sum, item) => sum + (item.clicks || 0), 0) || 0
      const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
      
      setAnalytics({
        totalViews,
        totalClicks,
        conversionRate,
        averageRating: 4.8 // Mock data
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Don't show error toast for analytics as it's not critical
    }
  }

  const handleCreateWidget = async () => {
    try {
      const business = await ensureUserHasBusiness()
      if (!business) return

      const widgetData = {
        business_id: business.id,
        name: widgetConfig.name,
        title: widgetConfig.title,
        subtitle: widgetConfig.subtitle,
        theme: widgetConfig.theme,
        position: widgetConfig.position,
        show_after: widgetConfig.show_after,
        button_text: widgetConfig.button_text,
        colors: widgetConfig.colors,
        is_active: true
      }

      const { data, error } = await createWidget(widgetData)
      console.log('Widget creation result:', { data, error })
      
      if (error) throw error
      
      toast.success('Widget created successfully!')
      setShowWidgetBuilder(false)
      resetWidgetConfig()
      fetchWidgets()
    } catch (error) {
      console.error('Error creating widget:', error)
      toast.error('Failed to create widget: ' + error.message)
    }
  }

  const handleEditWidget = (widget) => {
    setEditingWidget(widget)
    setWidgetConfig({
      name: widget.name || 'Review Widget',
      title: widget.title || 'How was your experience?',
      subtitle: widget.subtitle || 'We\'d love to hear your feedback!',
      theme: widget.theme || 'light',
      position: widget.position || 'bottom-right',
      show_after: widget.show_after || 5000,
      button_text: widget.button_text || 'Leave a Review',
      colors: widget.colors || {
        primary: '#007cba',
        secondary: '#f8f9fa',
        text: '#333333'
      }
    })
    setShowWidgetBuilder(true)
  }

  const handleUpdateWidget = async () => {
    try {
      if (!editingWidget) return

      const updates = {
        name: widgetConfig.name,
        title: widgetConfig.title,
        subtitle: widgetConfig.subtitle,
        theme: widgetConfig.theme,
        position: widgetConfig.position,
        show_after: widgetConfig.show_after,
        button_text: widgetConfig.button_text,
        colors: widgetConfig.colors
      }

      const { error } = await updateWidget(editingWidget.id, updates)
      
      if (error) throw error
      
      toast.success('Widget updated successfully!')
      setShowWidgetBuilder(false)
      setEditingWidget(null)
      resetWidgetConfig()
      fetchWidgets()
    } catch (error) {
      console.error('Error updating widget:', error)
      toast.error('Failed to update widget: ' + error.message)
    }
  }

  const handleDeleteWidget = async (widgetId) => {
    if (!confirm('Are you sure you want to delete this widget?')) return

    try {
      const { error } = await deleteWidget(widgetId)
      
      if (error) throw error
      
      toast.success('Widget deleted successfully!')
      fetchWidgets()
    } catch (error) {
      console.error('Error deleting widget:', error)
      toast.error('Failed to delete widget: ' + error.message)
    }
  }

  const resetWidgetConfig = () => {
    setWidgetConfig({
      name: 'Review Widget',
      title: 'How was your experience?',
      subtitle: 'We\'d love to hear your feedback!',
      theme: 'light',
      position: 'bottom-right',
      show_after: 5000,
      button_text: 'Leave a Review',
      colors: {
        primary: '#007cba',
        secondary: '#f8f9fa',
        text: '#333333'
      }
    })
  }

  const handleCopyCode = (widget) => {
    const code = generateWidgetCode(widget)
    navigator.clipboard.writeText(code)
    toast.success('Widget code copied to clipboard!')
  }

  const handleShowInstallModal = (widget) => {
    setSelectedWidget(widget)
    setShowInstallModal(true)
  }

  const generatePreviewWidget = () => {
    return {
      ...widgetConfig,
      widget_code: 'preview_widget',
      id: 'preview'
    }
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your review widgets and track performance</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Eye}
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          color="bg-blue-500"
        />
        <StatCard
          icon={MessageSquare}
          title="Total Clicks"
          value={analytics.totalClicks.toLocaleString()}
          color="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Conversion Rate"
          value={`${analytics.conversionRate}%`}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={analytics.averageRating}
          color="bg-purple-500"
        />
      </div>

      {/* Widget Builder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Widget Builder</h2>
            <Button 
              onClick={() => setShowWidgetBuilder(true)} 
              className="flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Widget
            </Button>
          </div>
          
          <div className="space-y-4">
            {widgets.map((widget, index) => (
              <div key={widget.id || index} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{widget.name || 'Unnamed Widget'}</h3>
                    <p className="text-sm text-gray-600 mt-1">ID: {widget.widget_code || 'demo-widget'}</p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(widget.created_at || Date.now()).toLocaleDateString()}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">
                        Views: {widget.views || 0}
                      </span>
                      <span className="text-sm text-gray-500">
                        Clicks: {widget.clicks || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleShowInstallModal(widget)} 
                      className="flex items-center"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Get Code
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleEditWidget(widget)}
                      className="flex items-center"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {widgets.length === 0 && (
              <div className="text-center py-8">
                <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No widgets created yet</p>
                <Button 
                  onClick={() => setShowWidgetBuilder(true)}
                  variant="secondary"
                >
                  Create Your First Widget
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Widget Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Widget Preview</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-sm mx-auto p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">{widgetConfig.title}</h3>
              <p className="text-gray-600 mb-4">{widgetConfig.subtitle}</p>
              <div className="flex justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <Button 
                size="sm" 
                className="w-full"
                style={{ backgroundColor: widgetConfig.colors.primary }}
              >
                {widgetConfig.button_text}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Theme: {widgetConfig.theme}</p>
            <p>Position: {widgetConfig.position}</p>
            <p>Show after: {widgetConfig.show_after}ms</p>
          </div>
        </div>
      </div>

      {/* Enhanced Widget Builder Modal */}
      {showWidgetBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-semibold">
                {editingWidget ? 'Edit Widget' : 'Create New Widget'}
              </h2>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setShowWidgetBuilder(false)
                  setEditingWidget(null)
                  resetWidgetConfig()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Configuration Panel */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Widget Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Widget Name
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.name}
                        onChange={(e) => setWidgetConfig({...widgetConfig, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Review Widget"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Widget Title
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.title}
                        onChange={(e) => setWidgetConfig({...widgetConfig, title: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="How was your experience?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <textarea
                        value={widgetConfig.subtitle}
                        onChange={(e) => setWidgetConfig({...widgetConfig, subtitle: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="We'd love to hear your feedback!"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.button_text}
                        onChange={(e) => setWidgetConfig({...widgetConfig, button_text: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave a Review"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Theme
                        </label>
                        <select
                          value={widgetConfig.theme}
                          onChange={(e) => setWidgetConfig({...widgetConfig, theme: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <select
                          value={widgetConfig.position}
                          onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Show After (milliseconds)
                      </label>
                      <input
                        type="number"
                        value={widgetConfig.show_after}
                        onChange={(e) => setWidgetConfig({...widgetConfig, show_after: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Delay before widget appears (5000 = 5 seconds)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={widgetConfig.colors.primary}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig, 
                            colors: {...widgetConfig.colors, primary: e.target.value}
                          })}
                          className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetConfig.colors.primary}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig, 
                            colors: {...widgetConfig.colors, primary: e.target.value}
                          })}
                          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#007cba"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview & Code Panel */}
              <div className="space-y-6">
                {/* Live Preview */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center justify-center relative">
                      <div className="max-w-xs mx-auto p-4 bg-white rounded-lg shadow-lg">
                        <h4 className="text-lg font-medium mb-2">{widgetConfig.title}</h4>
                        <p className="text-gray-600 mb-4 text-sm">{widgetConfig.subtitle}</p>
                        <div className="flex justify-center space-x-1 mb-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <button 
                          className="w-full text-white px-4 py-2 rounded-md text-sm font-medium"
                          style={{ backgroundColor: widgetConfig.colors.primary }}
                        >
                          {widgetConfig.button_text}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center">
                          <Monitor className="w-4 h-4 mr-1" />
                          Position: {widgetConfig.position}
                        </div>
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-1" />
                          Delay: {widgetConfig.show_after}ms
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HTML Code Display */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Generated HTML Code</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      <code>{generateWidgetCode(generatePreviewWidget())}</code>
                    </pre>
                  </div>
                  <Button 
                    onClick={() => {
                      const code = generateWidgetCode(generatePreviewWidget())
                      navigator.clipboard.writeText(code)
                      toast.success('HTML code copied to clipboard!')
                    }}
                    className="mt-3 flex items-center"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy HTML Code
                  </Button>
                </div>

                {/* Installation Instructions */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Installation Instructions</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <div>
                          <p className="font-medium">Copy the HTML code above</p>
                          <p className="text-gray-600">Click the "Copy HTML Code" button to copy to clipboard</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <div>
                          <p className="font-medium">Open your website's HTML file</p>
                          <p className="text-gray-600">Usually named <code className="bg-gray-200 px-1 rounded">index.html</code> or your main page template</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <div>
                          <p className="font-medium">Paste before the closing &lt;/body&gt; tag</p>
                          <p className="text-gray-600">Add the code just before <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> at the bottom of your HTML file</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                        <div>
                          <p className="font-medium">Save and refresh your website</p>
                          <p className="text-gray-600">The widget will appear after {widgetConfig.show_after/1000} seconds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowWidgetBuilder(false)
                  setEditingWidget(null)
                  resetWidgetConfig()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingWidget ? handleUpdateWidget : handleCreateWidget}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingWidget ? 'Update Widget' : 'Create Widget'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Install Modal */}
      {showInstallModal && selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-semibold">Install Widget: {selectedWidget.name}</h2>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowInstallModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-sm font-medium text-yellow-800">
                    Ready to install on your website? Follow these simple steps:
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Step 1: Copy Your Widget Code</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
                    <code>{generateWidgetCode(selectedWidget)}</code>
                  </pre>
                </div>
                <Button 
                  onClick={() => handleCopyCode(selectedWidget)}
                  className="mt-3 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Widget Code
                </Button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Step 2: Installation Guide</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                      <div>
                        <h4 className="font-medium">Open your HTML file</h4>
                        <p className="text-sm text-gray-600 mt-1">Open your website's main HTML file (usually <code className="bg-gray-200 px-1 rounded">index.html</code>) in a text editor</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                      <div>
                        <h4 className="font-medium">Find the closing &lt;/body&gt; tag</h4>
                        <p className="text-sm text-gray-600 mt-1">Scroll to the bottom of your HTML file and locate the <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> tag</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                      <div>
                        <h4 className="font-medium">Paste the widget code</h4>
                        <p className="text-sm text-gray-600 mt-1">Paste the copied widget code just before the <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> tag</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                      <div>
                        <h4 className="font-medium">Save and upload</h4>
                        <p className="text-sm text-gray-600 mt-1">Save your HTML file and upload it to your web server</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Step 3: Example HTML Structure</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700">
{`<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <h1>Your Website Content</h1>
    <p>Your existing content here...</p>
    
    <!-- Paste your widget code here -->
    ${generateWidgetCode(selectedWidget).split('\n').slice(0, 3).join('\n')}
    ...
    <!-- End widget code -->
</body>
</html>`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Widget Settings</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Position:</span> {selectedWidget.position}
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Delay:</span> {selectedWidget.show_after}ms
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Theme:</span> {selectedWidget.theme}
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Button Text:</span> {selectedWidget.button_text}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
