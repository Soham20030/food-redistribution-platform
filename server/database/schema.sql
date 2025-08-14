-- Remove the PostGIS line and create a basic schema
-- CREATE EXTENSION postgis; -- Comment this out for now

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
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
    -- location GEOGRAPHY(POINT, 4326), -- Remove this line
    latitude DECIMAL(10, 8), -- Simple lat/long instead
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    cuisine_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    -- location GEOGRAPHY(POINT, 4326), -- Remove this line  
    latitude DECIMAL(10, 8), -- Simple lat/long instead
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    organization_type VARCHAR(100),
    description TEXT,
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
    expiry_date DATE,
    pickup_time_start TIMESTAMP,
    pickup_time_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'picked_up', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_food_listings_restaurant_id ON food_listings(restaurant_id);
CREATE INDEX idx_food_listings_status ON food_listings(status);
