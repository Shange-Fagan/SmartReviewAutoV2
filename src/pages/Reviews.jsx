import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getReviews, createReview, deleteReview, getBusiness, updateReview } from '../lib/supabase'
import Button from '../components/Button'
import { Trash2, Edit, Plus, Star, Save, X } from 'lucide-react'

const Reviews = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5
  })

  useEffect(() => {
    if (user) {
      fetchBusinessAndReviews()
    }
  }, [user])

  const fetchBusinessAndReviews = async () => {
    setLoading(true)
    
    // First get the user's business
    const { data: businessData, error: businessError } = await getBusiness(user.id)
    
    if (businessData) {
      setBusiness(businessData)
      
      // Then get reviews for this business
      const { data: reviewsData, error: reviewsError } = await getReviews(businessData.id)
      if (reviewsData) {
        setReviews(reviewsData)
      }
    } else {
      console.error('No business found for user:', businessError)
      setReviews([])
    }
    
    setLoading(false)
  }

  const fetchReviews = async () => {
    if (business) {
      const { data, error } = await getReviews(business.id)
      if (data) {
        setReviews(data)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!business) {
      alert('No business found. Please set up your business first.')
      return
    }
    
    if (editingReview) {
      // Update existing review
      const { data, error } = await updateReview(editingReview.id, formData)
      if (data) {
        await fetchReviews()
        setEditingReview(null)
        setShowForm(false)
        setFormData({ title: '', content: '', rating: 5 })
      }
    } else {
      // Create new review
      const reviewData = {
        ...formData,
        user_id: user.id,
        business_id: business.id,
        status: 'published'
      }

      const { data, error } = await createReview(reviewData)
      if (data) {
        await fetchReviews()
        setShowForm(false)
        setFormData({ title: '', content: '', rating: 5 })
      }
    }
  }

  const handleEdit = (review) => {
    setEditingReview(review)
    setFormData({
      title: review.title,
      content: review.content,
      rating: review.rating
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setShowForm(false)
    setFormData({ title: '', content: '', rating: 5 })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      const { error } = await deleteReview(id)
      if (!error) {
        await fetchReviews()
      }
    }
  }

  const handleBulkDelete = async () => {
    if (window.confirm('Are you sure you want to delete ALL reviews? This cannot be undone.')) {
      for (const review of reviews) {
        await deleteReview(review.id)
      }
      await fetchReviews()
    }
  }

  const handleGenerateRandomReviews = async () => {
    if (!business) {
      alert('No business found. Please set up your business first.')
      return
    }

    const sampleReviews = [
      {
        title: 'Great Service!',
        content: 'I was impressed with the quality of service. The team was professional and delivered exactly what was promised.',
        rating: 5,
        user_id: user.id,
        business_id: business.id,
        status: 'published'
      },
      {
        title: 'Good Experience',
        content: 'Overall a positive experience. There were some minor issues but they were resolved quickly.',
        rating: 4,
        user_id: user.id,
        business_id: business.id,
        status: 'published'
      },
      {
        title: 'Excellent Product',
        content: 'The product quality exceeded my expectations. Will definitely recommend to others.',
        rating: 5,
        user_id: user.id,
        business_id: business.id,
        status: 'published'
      }
    ]

    for (const review of sampleReviews) {
      await createReview(review)
    }
    
    await fetchReviews()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Review
          </Button>
          <Button onClick={handleGenerateRandomReviews} variant="secondary">
            Generate Sample Reviews
          </Button>
          {reviews.length > 0 && (
            <Button onClick={handleBulkDelete} variant="danger">
              Delete All
            </Button>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingReview ? 'Edit Review' : 'Add New Review'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex items-center">
                {editingReview ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingReview ? 'Update Review' : 'Save Review'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancelEdit} className="flex items-center">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md">
        {!business ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No business found. Please set up your business first.</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No reviews yet for your business.</p>
            <p className="text-gray-400 text-sm mb-4">Reviews will appear here when customers use your embedded widgets.</p>
            <Button onClick={() => setShowForm(true)}>
              Add Sample Review
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 mr-4">
                        {review.title}
                      </h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{review.content}</p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(review)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(review.id)}
                      className="flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews
