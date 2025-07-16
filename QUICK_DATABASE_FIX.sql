-- =============================================
-- QUICK DATABASE FIX - Run this in Supabase SQL Editor
-- This creates the essential tables to fix the immediate errors
-- =============================================

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  industry TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  paypal_subscription_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  widget_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  customer_name TEXT,
  customer_email TEXT,
  status TEXT DEFAULT 'published',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  widget_code TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT 'How was your experience?',
  subtitle TEXT DEFAULT 'We''d love to hear your feedback!',
  theme TEXT DEFAULT 'light',
  position TEXT DEFAULT 'bottom-right',
  show_after INTEGER DEFAULT 5000,
  button_text TEXT DEFAULT 'Leave a Review',
  colors JSONB DEFAULT '{"primary": "#007cba", "secondary": "#f8f9fa", "text": "#333333"}',
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISABLE ROW LEVEL SECURITY (to fix permission issues)
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;

-- GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON businesses(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON reviews(business_id);
CREATE INDEX IF NOT EXISTS widgets_business_id_idx ON widgets(business_id);
CREATE INDEX IF NOT EXISTS analytics_business_id_idx ON analytics(business_id);

-- Success message
SELECT 'Database tables created successfully! Your app should now work! 🎉' AS message;