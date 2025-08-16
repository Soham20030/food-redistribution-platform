-- Complete Food Redistribution Platform Database Schema
-- Remove the PostGIS line and create a basic schema

-- CREATE EXTENSION postgis; -- Comment this out for now

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- Keep this for compatibility
    password_hash VARCHAR(255),              -- Add this for your auth code
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('restaurant', 'organization', 'volunteer')),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8), -- Simple lat/long instead of PostGIS
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    cuisine_type VARCHAR(100),
    description TEXT,
    operating_hours TEXT, -- Missing column that was causing errors
    license_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8), -- Simple lat/long instead of PostGIS
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    organization_type VARCHAR(100),
    description TEXT,
    tax_id VARCHAR(100),
    service_area TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    availability TEXT,
    transportation VARCHAR(100),
    skills TEXT,
    background_check BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_listings (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50),
    food_type VARCHAR(100),
    allergens TEXT,
    expiry_date DATE,
    pickup_time_start TIMESTAMP,
    pickup_time_end TIMESTAMP,
    pickup_instructions TEXT,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'picked_up', 'expired', 'cancelled')),
    estimated_meals INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missing table that was causing errors
CREATE TABLE food_claims (
    id SERIAL PRIMARY KEY,
    food_listing_id INTEGER REFERENCES food_listings(id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_pickup_time TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'picked_up', 'completed', 'cancelled')),
    notes TEXT,
    pickup_confirmation_code VARCHAR(20),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_assignments (
    id SERIAL PRIMARY KEY,
    volunteer_id INTEGER REFERENCES volunteers(id) ON DELETE CASCADE,
    food_claim_id INTEGER REFERENCES food_claims(id) ON DELETE CASCADE,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- Can reference food_listing, food_claim, etc.
    related_type VARCHAR(50), -- 'food_listing', 'food_claim', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comprehensive indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);

CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_location ON organizations(latitude, longitude);
CREATE INDEX idx_organizations_type ON organizations(organization_type);

CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_location ON volunteers(latitude, longitude);
CREATE INDEX idx_volunteers_availability ON volunteers(availability);

CREATE INDEX idx_food_listings_restaurant_id ON food_listings(restaurant_id);
CREATE INDEX idx_food_listings_status ON food_listings(status);
CREATE INDEX idx_food_listings_expiry_date ON food_listings(expiry_date);
CREATE INDEX idx_food_listings_pickup_time ON food_listings(pickup_time_start);
CREATE INDEX idx_food_listings_created_at ON food_listings(created_at);

CREATE INDEX idx_food_claims_food_listing_id ON food_claims(food_listing_id);
CREATE INDEX idx_food_claims_organization_id ON food_claims(organization_id);
CREATE INDEX idx_food_claims_volunteer_id ON food_claims(volunteer_id);
CREATE INDEX idx_food_claims_status ON food_claims(status);
CREATE INDEX idx_food_claims_claim_date ON food_claims(claim_date);

CREATE INDEX idx_volunteer_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_volunteer_assignments_food_claim_id ON volunteer_assignments(food_claim_id);
CREATE INDEX idx_volunteer_assignments_status ON volunteer_assignments(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
