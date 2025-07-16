import React, { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useAuth } from '../contexts/AuthContext'
import { PRICING_PLANS, createCustomerPortalSession } from '../lib/paypalService'
import { getSubscription, getUserPayPalSubscriptionId } from '../lib/supabase'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'

const Billing = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('paypal') // 'paypal' or 'card'

  // PayPal configuration - Production mode
  const paypalOptions = {
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'subscription',
    vault: true,
    components: 'buttons,hosted-fields',
    'disable-funding': 'credit',
    'data-namespace': 'paypal_sdk',
    'merchant-id': import.meta.env.VITE_PAYPAL_MERCHANT_ID,
    'enable-funding': 'venmo,paylater'
  }

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return
      
      try {
        const { data, error } = await getSubscription(user.id)
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error loading subscription:', error)
        } else {
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error loading subscription:', error)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscription()
  }, [user])

  const handleDebugPayPal = async () => {
    try {
      const response = await fetch('/.netlify/functions/debug-paypal')
      const debug = await response.json()
      console.log('🔍 PayPal Debug Info:', debug)
      toast.success('Debug info logged to console')
    } catch (error) {
      console.error('Debug failed:', error)
      toast.error('Debug failed: ' + error.message)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      // First try to get the PayPal subscription ID from subscription
      let paypalSubscriptionId = subscription?.paypal_subscription_id
      
      if (!paypalSubscriptionId) {
        // If not found in subscription, try to get it from the database
        const { data, error } = await getUserPayPalSubscriptionId(user.id)
        if (error || !data?.paypal_subscription_id) {
          throw new Error('No active subscription found. Please subscribe to a plan first.')
        }
        paypalSubscriptionId = data.paypal_subscription_id
      }

      await createCustomerPortalSession(paypalSubscriptionId)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // PayPal subscription creation using our backend endpoint
  const createSubscription = async (planId) => {
    // Set the selected plan based on the provided planId
    setSelectedPlan(planId);
    
    const plan = PRICING_PLANS[planId.toUpperCase()];
    if (!plan || !plan.planId) {
      toast.error('Invalid plan selected');
      return;
    }
    
    console.log('Creating subscription for plan:', planId, plan);
    setLoading(true);

    try {
      // Call our backend to create the subscription
      const response = await fetch('/.netlify/functions/create-paypal-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.planId,
          userId: user.id,
          userEmail: user.email,
          returnUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal subscription creation error:', errorText);
        toast.error('Failed to create subscription. Please try again.');
        setLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.approvalUrl) {
        console.log('Redirecting to PayPal approval URL:', result.approvalUrl);
        window.location.href = result.approvalUrl;
      } else {
        toast.error('Invalid response from server. Missing approval URL.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
      toast.error('Error creating subscription: ' + error.message);
      setLoading(false);
    }
  }

  // Handle successful subscription approval
  const onApprove = async (data, actions) => {
    try {
      setLoading(true)
      
      // Call our backend to handle the subscription approval
      const response = await fetch('/.netlify/functions/handle-paypal-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          userId: user.id,
          planId: selectedPlan
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process subscription')
      }

      const result = await response.json()
      
      toast.success('Subscription activated successfully!')
      
      // Refresh subscription data
      const { data: subscriptionData } = await getSubscription(user.id)
      setSubscription(subscriptionData)
      setSelectedPlan(null)
      
    } catch (error) {
      console.error('Subscription approval error:', error)
      toast.error('Failed to activate subscription: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle subscription errors
  const onError = (err) => {
    console.error('PayPal subscription error:', err)
    toast.error('Payment failed. Please try again.')
    setLoading(false)
  }

  // Handle subscription cancellation
  const onCancel = (data) => {
    console.log('PayPal subscription cancelled:', data)
    toast.info('Payment cancelled')
    setSelectedPlan(null)
    setLoading(false)
  }

  // PayPal Buttons component for subscriptions
  const PayPalSubscriptionButton = ({ plan }) => {
    // Set selected plan before rendering the button
    React.useEffect(() => {
      if (plan && plan.id) {
        setSelectedPlan(plan.id);
      }
    }, [plan]);
    
    return (
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'subscribe'
        }}
        createSubscription={(data, actions) => {
          // Double-check that plan is still selected
          if (!selectedPlan) {
            setSelectedPlan(plan.id);
          }
          return createSubscription(data, actions);
        }}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={loading || (subscription && subscription.status === 'active')}
      />
    );
  }

  // Always use production mode for PayPal
  const isDevelopment = false

  if (isDevelopment) {
    console.log('🚧 Development Mode: PayPal integration disabled')
  }

  // Mock subscription function for development
  const handleMockSubscribe = async (planId) => {
    setLoading(true)
    try {
      console.log('🚧 Mock subscription for plan:', planId)
      toast.success(`Mock subscription created for ${planId} plan`)
      
      // Simulate subscription creation
      setTimeout(() => {
        setSubscription({
          id: 'mock-sub-' + Date.now(),
          status: 'active',
          plan_name: PRICING_PLANS[planId.toUpperCase()].name,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  // Extract error parameter from URL if present
  const location = window.location;
  
  // Clear any toast messages from previous sessions
  useEffect(() => {
    // Check for success or error params
    if (location.search.includes('success=true')) {
      toast.success('Subscription activated successfully!');
    } else if (location.search.includes('canceled=true')) {
      toast.info('Payment cancelled');
    }
  }, []);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Choose Your Plan</h1>
            <p className="text-lg text-gray-600 max-w-2xl">Select the perfect plan for your business needs and start collecting valuable customer reviews today.</p>
            <div className="flex items-center gap-2 mt-4">
              <img 
                src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                alt="PayPal" 
                className="h-6"
              />
              <span className="text-sm text-gray-600">Secure payments powered by PayPal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleDebugPayPal} className="bg-yellow-600 hover:bg-yellow-700 shadow-md">
              Debug PayPal
            </Button>
            {subscription && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                Current Plan: {subscription.plan_name || 'Active'}
              </div>
            )}
          </div>
        </div>
        
        {/* Show any error messages at the top */}
        <div className="mb-8">
          {location.search.includes('error=true') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">
                  There was a problem processing your subscription. Please try again.
                </p>
              </div>
            </div>
          )}
        </div>

        {isDevelopment && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
                <p className="text-sm text-yellow-700">PayPal integration is disabled. Using mock functions for testing.</p>
              </div>
            </div>
          </div>
        )}

        {subscriptionLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading subscription...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Object.values(PRICING_PLANS).map(plan => (
              <div key={plan.id} className={`bg-white p-6 rounded-xl shadow-lg relative transform transition-all duration-300 ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : 'hover:shadow-xl'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
                <div className="my-3 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="ml-1 text-xl text-gray-500 font-medium">/mo</span>
                </div>
                <div className="border-t border-gray-100 my-4"></div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-gray-600 flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-100 my-6"></div>

                <div className="mt-6">
                  {subscription && subscription.status === 'active' ? (
                    <Button disabled className="w-full bg-gray-400">
                      Current Plan
                    </Button>
                  ) : isDevelopment ? (
                    <Button
                      onClick={() => handleMockSubscribe(plan.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Subscribe (Mock)'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Payment method selector */}
                      <div className="flex space-x-2 mb-4">
                        <button
                          onClick={() => setPaymentMethod('paypal')}
                          className={`flex-1 py-3 px-4 text-sm rounded-md border transition-all duration-200 flex items-center justify-center ${
                            paymentMethod === 'paypal' 
                              ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <img 
                            src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                            alt="PayPal" 
                            className="h-4 mr-2"
                          />
                          PayPal
                        </button>
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 py-3 px-4 text-sm rounded-md border transition-all duration-200 flex items-center justify-center ${
                            paymentMethod === 'card' 
                              ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <svg className="h-4 w-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="16" rx="2" fill={paymentMethod === 'card' ? '#3B82F6' : '#4B5563'}/>
                            <path d="M5 10H7V13H5V10Z" fill="white"/>
                            <path d="M8 10H10V13H8V10Z" fill="white"/>
                            <path d="M11 10H13V13H11V10Z" fill="white"/>
                          </svg>
                          Credit Card
                        </button>
                      </div>

                      {/* PayPal/Card Subscription Buttons */}
                      {paymentMethod === 'paypal' ? (
                        <Button
                          onClick={() => createSubscription(plan.id)}
                          disabled={loading || (subscription && subscription.status === 'active')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium rounded-md shadow-md transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-2 h-5 w-5 border-b-2 border-white rounded-full"></div>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <img 
                                src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                                alt="PayPal" 
                                className="h-4 mr-2"
                              />
                              Subscribe Now
                            </div>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => createSubscription(plan.id)}
                          disabled={loading || (subscription && subscription.status === 'active')}
                          className="w-full bg-black hover:bg-gray-800 text-white py-3 font-medium rounded-md shadow-md transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-2 h-5 w-5 border-b-2 border-white rounded-full"></div>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="h-4 w-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="24" height="16" rx="2" fill="currentColor"/>
                                <path d="M5 10H7V13H5V10Z" fill="white"/>
                                <path d="M8 10H10V13H8V10Z" fill="white"/>
                                <path d="M11 10H13V13H11V10Z" fill="white"/>
                              </svg>
                              Pay with Card
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Subscription Management Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Your Subscription</h2>
              <p className="text-gray-600 mb-6">Access your PayPal billing portal to view or cancel your subscription at any time.</p>
              
              {subscription ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-blue-800">Active Subscription</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Status:</span> 
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {subscription.status || 'Active'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Plan:</span> 
                    <span className="ml-2 font-medium text-blue-700">
                      {subscription.plan_name || 'Premium'}
                    </span>
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Next billing:</span> 
                      <span className="ml-2">
                        {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-800 font-medium">
                      No active subscription found. Subscribe to a plan to access the billing portal.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleManageSubscription}
                disabled={loading || !subscription}
                className={`w-full py-3 rounded-lg shadow-md font-medium transition-all duration-200 ${
                  subscription 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 h-5 w-5 border-b-2 border-white rounded-full"></div>
                    Loading...
                  </div>
                ) : 'Manage Subscription'}
              </Button>

              {/* PayPal branding */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <img 
                    src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                    alt="PayPal" 
                    className="h-5"
                  />
                  <span>Secure billing powered by PayPal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  )
}

export default Billing

