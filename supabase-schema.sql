-- =============================================
-- SMART REVIEW SAAS - COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BUSINESSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT DEFAULT 'General',
  description TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  postal_code TEXT,
  google_place_id TEXT,
  yelp_business_id TEXT,
  facebook_page_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  paypal_subscription_id TEXT,
  paypal_plan_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WIDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  widget_code TEXT UNIQUE NOT NULL,
  widget_type TEXT DEFAULT 'review_popup',
  title TEXT DEFAULT 'How was your experience?',
  subtitle TEXT DEFAULT 'We''d love to hear your feedback!',
  theme TEXT DEFAULT 'light',
  position TEXT DEFAULT 'bottom-right',
  show_after INTEGER DEFAULT 5000,
  button_text TEXT DEFAULT 'Leave a Review',
  colors JSONB DEFAULT '{"primary": "#007cba", "secondary": "#f8f9fa", "text": "#333333"}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'published',
  source TEXT DEFAULT 'widget',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEW_REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON businesses(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS widgets_business_id_idx ON widgets(business_id);
CREATE INDEX IF NOT EXISTS widgets_widget_code_idx ON widgets(widget_code);
CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON reviews(business_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE INDEX IF NOT EXISTS review_requests_business_id_idx ON review_requests(business_id);
CREATE INDEX IF NOT EXISTS analytics_business_id_idx ON analytics(business_id);
CREATE INDEX IF NOT EXISTS analytics_date_idx ON analytics(date);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_requests_updated_at BEFORE UPDATE ON review_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Users can view own businesses" ON businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own businesses" ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own businesses" ON businesses FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Widgets policies
CREATE POLICY "Users can view own widgets" ON widgets FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = widgets.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can insert own widgets" ON widgets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = widgets.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can update own widgets" ON widgets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = widgets.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can delete own widgets" ON widgets FOR DELETE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = widgets.business_id AND businesses.user_id = auth.uid())
);

-- Public widget access for embedding
CREATE POLICY "Public can view active widgets" ON widgets FOR SELECT USING (is_active = true);

-- Reviews policies
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.user_id = auth.uid())
);

-- Public review submission
CREATE POLICY "Anyone can submit reviews" ON reviews FOR INSERT WITH CHECK (status = 'published');

-- Review requests policies
CREATE POLICY "Users can view own review requests" ON review_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = review_requests.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can insert own review requests" ON review_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = review_requests.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can update own review requests" ON review_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = review_requests.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can delete own review requests" ON review_requests FOR DELETE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = review_requests.business_id AND businesses.user_id = auth.uid())
);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = analytics.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can insert own analytics" ON analytics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = analytics.business_id AND businesses.user_id = auth.uid())
);
CREATE POLICY "Users can update own analytics" ON analytics FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE businesses.id = analytics.business_id AND businesses.user_id = auth.uid())
);

-- Public analytics tracking
CREATE POLICY "Anyone can track analytics" ON analytics FOR INSERT WITH CHECK (true);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Function to generate widget codes
CREATE OR REPLACE FUNCTION generate_widget_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'widget_' || encode(gen_random_bytes(8), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get user's PayPal subscription ID
CREATE OR REPLACE FUNCTION get_user_paypal_subscription_id(user_uuid UUID)
RETURNS TABLE(paypal_subscription_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.paypal_subscription_id
    FROM subscriptions s
    WHERE s.user_id = user_uuid
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update widget stats
CREATE OR REPLACE FUNCTION increment_widget_stats(widget_uuid UUID, stat_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF stat_type = 'views' THEN
        UPDATE widgets SET views = views + 1 WHERE id = widget_uuid;
    ELSIF stat_type = 'clicks' THEN
        UPDATE widgets SET clicks = clicks + 1 WHERE id = widget_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMPLETED SCHEMA
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Smart Review SaaS database schema created successfully! 🎉' AS message;