CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: are_users_connected(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.are_users_connected(user1_id uuid, user2_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user1_id AND addressee_id = user2_id)
      OR (addressee_id = user1_id AND requester_id = user2_id)
    )
  )
$$;


--
-- Name: get_connection_status(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_connection_status(user1_id uuid, user2_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN status = 'accepted' THEN 'connected'
          WHEN requester_id = user1_id THEN 'pending_sent'
          ELSE 'pending_received'
        END
      FROM public.user_connections
      WHERE (
        (requester_id = user1_id AND addressee_id = user2_id)
        OR (addressee_id = user1_id AND requester_id = user2_id)
      )
      AND status IN ('pending', 'accepted')
      LIMIT 1
    ),
    'none'
  )
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_post_comments_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_comments_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_post_likes_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_post_likes_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    cover_image text,
    tags text[],
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    booking_type text NOT NULL,
    booking_reference text NOT NULL,
    passenger_name text NOT NULL,
    passenger_email text NOT NULL,
    passenger_phone text NOT NULL,
    from_location text NOT NULL,
    to_location text NOT NULL,
    departure_date date NOT NULL,
    departure_time time without time zone NOT NULL,
    arrival_date date,
    arrival_time time without time zone,
    service_name text NOT NULL,
    service_number text NOT NULL,
    seat_number text,
    class_type text,
    price_inr numeric NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_id text,
    qr_code text,
    booking_details jsonb,
    status text DEFAULT 'confirmed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    trip_group_id uuid,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    CONSTRAINT booking_locations_length CHECK ((((length(from_location) >= 2) AND (length(from_location) <= 100)) AND ((length(to_location) >= 2) AND (length(to_location) <= 100)))),
    CONSTRAINT booking_passenger_email_length CHECK (((length(passenger_email) >= 5) AND (length(passenger_email) <= 255))),
    CONSTRAINT booking_passenger_name_length CHECK (((length(passenger_name) >= 2) AND (length(passenger_name) <= 100))),
    CONSTRAINT booking_passenger_phone_length CHECK (((length(passenger_phone) >= 10) AND (length(passenger_phone) <= 15))),
    CONSTRAINT booking_price_positive CHECK (((price_inr > (0)::numeric) AND (price_inr <= (1000000)::numeric))),
    CONSTRAINT bookings_booking_type_check CHECK ((booking_type = ANY (ARRAY['flight'::text, 'train'::text, 'bus'::text, 'hotel'::text, 'multi-segment'::text]))),
    CONSTRAINT bookings_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text])))
);


--
-- Name: bucket_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bucket_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trip_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_content_length CHECK (((length(content) >= 1) AND (length(content) <= 2000)))
);


--
-- Name: photo_albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    album_id uuid,
    file_path text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: post_saves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_saves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    image_url text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    itinerary jsonb
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    interests text[] DEFAULT '{}'::text[],
    budget_range text,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bio text,
    age integer,
    gender text,
    phone text,
    home_location text,
    languages_spoken text[],
    travel_preferences text[],
    date_of_birth date,
    country text,
    state text,
    is_public boolean DEFAULT true
);


--
-- Name: public_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_profiles AS
 SELECT id,
    full_name,
    avatar_url,
    bio,
    interests,
    budget_range,
    home_location,
    languages_spoken,
    travel_preferences,
    country,
    state,
    is_public,
    created_at,
    updated_at
   FROM public.profiles
  WHERE (is_public = true);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name text,
    email text,
    rating integer NOT NULL,
    review_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: ticket_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    verified_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_by text,
    verification_location text
);


--
-- Name: travel_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travel_group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT travel_group_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: travel_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travel_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    title text NOT NULL,
    from_location text NOT NULL,
    to_location text NOT NULL,
    travel_date date NOT NULL,
    travel_mode text NOT NULL,
    max_members integer DEFAULT 10,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: trip_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trip_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trip_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_segments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trip_group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    segment_order integer NOT NULL,
    booking_type text NOT NULL,
    service_name text NOT NULL,
    service_number text NOT NULL,
    from_location text NOT NULL,
    to_location text NOT NULL,
    departure_date date NOT NULL,
    departure_time time without time zone NOT NULL,
    arrival_time time without time zone NOT NULL,
    passenger_name text NOT NULL,
    passenger_email text NOT NULL,
    passenger_phone text NOT NULL,
    seat_number text,
    class_type text,
    price_inr numeric NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    payment_status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cancelled_at timestamp with time zone,
    cancellation_reason text
);


--
-- Name: trip_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trip_group_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    shared_with_email text NOT NULL,
    shared_with_user_id uuid,
    access_level text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trip_shares_access_level_check CHECK ((access_level = ANY (ARRAY['view'::text, 'join'::text]))),
    CONSTRAINT trip_shares_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    destination text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    trip_type text NOT NULL,
    planner_mode text,
    budget_inr numeric(12,2),
    group_size integer DEFAULT 1,
    interests text[],
    itinerary jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_public boolean DEFAULT false,
    likes_count integer DEFAULT 0,
    image_url text,
    CONSTRAINT trips_planner_mode_check CHECK ((planner_mode = ANY (ARRAY['comfort'::text, 'time'::text, 'budget'::text]))),
    CONSTRAINT trips_trip_type_check CHECK ((trip_type = ANY (ARRAY['ai'::text, 'manual'::text])))
);


--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid NOT NULL,
    addressee_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_connections_check CHECK ((requester_id <> addressee_id)),
    CONSTRAINT user_connections_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_follows_check CHECK ((follower_id <> following_id))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: bucket_list bucket_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_list
    ADD CONSTRAINT bucket_list_pkey PRIMARY KEY (id);


--
-- Name: bucket_list bucket_list_trip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_list
    ADD CONSTRAINT bucket_list_trip_id_user_id_key UNIQUE (trip_id, user_id);


--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: photo_albums photo_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: post_saves post_saves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_saves
    ADD CONSTRAINT post_saves_pkey PRIMARY KEY (id);


--
-- Name: post_saves post_saves_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_saves
    ADD CONSTRAINT post_saves_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: ticket_verifications ticket_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_verifications
    ADD CONSTRAINT ticket_verifications_pkey PRIMARY KEY (id);


--
-- Name: travel_group_members travel_group_members_group_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_group_members
    ADD CONSTRAINT travel_group_members_group_id_user_id_key UNIQUE (group_id, user_id);


--
-- Name: travel_group_members travel_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_group_members
    ADD CONSTRAINT travel_group_members_pkey PRIMARY KEY (id);


--
-- Name: travel_groups travel_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_groups
    ADD CONSTRAINT travel_groups_pkey PRIMARY KEY (id);


--
-- Name: trip_likes trip_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_likes
    ADD CONSTRAINT trip_likes_pkey PRIMARY KEY (id);


--
-- Name: trip_likes trip_likes_trip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_likes
    ADD CONSTRAINT trip_likes_trip_id_user_id_key UNIQUE (trip_id, user_id);


--
-- Name: trip_segments trip_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_segments
    ADD CONSTRAINT trip_segments_pkey PRIMARY KEY (id);


--
-- Name: trip_shares trip_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_shares
    ADD CONSTRAINT trip_shares_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);


--
-- Name: user_connections user_connections_requester_id_addressee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_addressee_id_key UNIQUE (requester_id, addressee_id);


--
-- Name: user_follows user_follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_bookings_departure; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_departure ON public.bookings USING btree (departure_date);


--
-- Name: idx_bookings_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_reference ON public.bookings USING btree (booking_reference);


--
-- Name: idx_bookings_trip_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_trip_group ON public.bookings USING btree (trip_group_id);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at DESC);


--
-- Name: idx_trip_segments_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trip_segments_group ON public.trip_segments USING btree (trip_group_id, segment_order);


--
-- Name: idx_trip_segments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trip_segments_user ON public.trip_segments USING btree (user_id);


--
-- Name: idx_user_connections_addressee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_addressee ON public.user_connections USING btree (addressee_id, status);


--
-- Name: idx_user_connections_both; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_both ON public.user_connections USING btree (requester_id, addressee_id);


--
-- Name: idx_user_connections_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_connections_requester ON public.user_connections USING btree (requester_id, status);


--
-- Name: post_comments post_comments_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER post_comments_count_trigger AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();


--
-- Name: post_likes post_likes_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER post_likes_count_trigger AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trip_shares update_trip_shares_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trip_shares_updated_at BEFORE UPDATE ON public.trip_shares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trips update_trips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_connections update_user_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: articles articles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bucket_list bucket_list_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_list
    ADD CONSTRAINT bucket_list_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: bucket_list bucket_list_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bucket_list
    ADD CONSTRAINT bucket_list_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: group_messages group_messages_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.travel_groups(id) ON DELETE CASCADE;


--
-- Name: group_messages group_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: photo_albums photo_albums_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_albums
    ADD CONSTRAINT photo_albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: photos photos_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.photo_albums(id) ON DELETE SET NULL;


--
-- Name: photos photos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: post_saves post_saves_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_saves
    ADD CONSTRAINT post_saves_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_saves post_saves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_saves
    ADD CONSTRAINT post_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: ticket_verifications ticket_verifications_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_verifications
    ADD CONSTRAINT ticket_verifications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: travel_group_members travel_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_group_members
    ADD CONSTRAINT travel_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.travel_groups(id) ON DELETE CASCADE;


--
-- Name: travel_group_members travel_group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_group_members
    ADD CONSTRAINT travel_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: travel_groups travel_groups_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travel_groups
    ADD CONSTRAINT travel_groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: trip_likes trip_likes_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_likes
    ADD CONSTRAINT trip_likes_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trip_likes trip_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_likes
    ADD CONSTRAINT trip_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trips trips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_addressee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_follows user_follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bookings Admins can delete bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Anyone can submit reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit reviews" ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: post_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);


--
-- Name: user_follows Anyone can view follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);


--
-- Name: travel_group_members Anyone can view group members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view group members" ON public.travel_group_members FOR SELECT USING (true);


--
-- Name: post_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);


--
-- Name: posts Anyone can view posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);


--
-- Name: articles Anyone can view published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (((is_published = true) OR (auth.uid() = user_id)));


--
-- Name: travel_groups Anyone can view travel groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view travel groups" ON public.travel_groups FOR SELECT USING (true);


--
-- Name: trip_likes Anyone can view trip likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view trip likes" ON public.trip_likes FOR SELECT USING (true);


--
-- Name: travel_groups Creators can delete own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can delete own groups" ON public.travel_groups FOR DELETE USING ((auth.uid() = creator_id));


--
-- Name: travel_groups Creators can update own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Creators can update own groups" ON public.travel_groups FOR UPDATE USING ((auth.uid() = creator_id));


--
-- Name: group_messages Group members can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Group members can send messages" ON public.group_messages FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.travel_group_members
  WHERE ((travel_group_members.group_id = group_messages.group_id) AND (travel_group_members.user_id = auth.uid()) AND (travel_group_members.status = 'accepted'::text))))));


--
-- Name: group_messages Group members can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Group members can view messages" ON public.group_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.travel_group_members
  WHERE ((travel_group_members.group_id = group_messages.group_id) AND (travel_group_members.user_id = auth.uid()) AND (travel_group_members.status = 'accepted'::text)))));


--
-- Name: trip_shares Invited users can update share status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Invited users can update share status" ON public.trip_shares FOR UPDATE USING (((shared_with_user_id = auth.uid()) OR (shared_with_email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: trip_shares Invited users can view shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Invited users can view shares" ON public.trip_shares FOR SELECT USING (((shared_with_user_id = auth.uid()) OR (shared_with_email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: reviews Only admins can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view reviews" ON public.reviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_verifications Only authenticated users can verify tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only authenticated users can verify tickets" ON public.ticket_verifications FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = ticket_verifications.booking_id) AND (bookings.status = 'confirmed'::text) AND (bookings.payment_status = 'completed'::text))))));


--
-- Name: ticket_verifications Rate limit ticket verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Rate limit ticket verifications" ON public.ticket_verifications FOR INSERT WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM public.ticket_verifications tv
  WHERE ((tv.booking_id = ticket_verifications.booking_id) AND (tv.verified_at > (now() - '01:00:00'::interval)))))));


--
-- Name: trip_shares Trip owners can create shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trip owners can create shares" ON public.trip_shares FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: trip_shares Trip owners can delete shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trip owners can delete shares" ON public.trip_shares FOR DELETE USING ((auth.uid() = owner_id));


--
-- Name: trip_shares Trip owners can view their shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trip owners can view their shares" ON public.trip_shares FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: bucket_list Users can add to bucket list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to bucket list" ON public.bucket_list FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_comments Users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_connections Users can create connection requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create connection requests" ON public.user_connections FOR INSERT WITH CHECK ((auth.uid() = requester_id));


--
-- Name: photo_albums Users can create own albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own albums" ON public.photo_albums FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: articles Users can create own articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own articles" ON public.articles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can create own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own bookings" ON public.bookings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: posts Users can create own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trip_segments Users can create own trip segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own trip segments" ON public.trip_segments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trips Users can create own trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own trips" ON public.trips FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: travel_groups Users can create travel groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create travel groups" ON public.travel_groups FOR INSERT WITH CHECK ((auth.uid() = creator_id));


--
-- Name: photo_albums Users can delete own albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own albums" ON public.photo_albums FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: articles Users can delete own articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own articles" ON public.articles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: photos Users can delete own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own photos" ON public.photos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: posts Users can delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trips Users can delete own trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: bookings Users can delete pending bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete pending bookings" ON public.bookings FOR DELETE USING (((auth.uid() = user_id) AND (payment_status = 'pending'::text) AND (created_at > (now() - '01:00:00'::interval))));


--
-- Name: user_connections Users can delete their own connection requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own connection requests" ON public.user_connections FOR DELETE USING (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


--
-- Name: user_follows Users can follow others; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: travel_group_members Users can join groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join groups" ON public.travel_group_members FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: travel_group_members Users can leave groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave groups" ON public.travel_group_members FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_likes Users can like posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trip_likes Users can like trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like trips" ON public.trip_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: bucket_list Users can remove from bucket list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from bucket list" ON public.bucket_list FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_saves Users can save posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can save posts" ON public.post_saves FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = messages.recipient_id) AND (profiles.is_public = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_connections
  WHERE ((user_connections.status = 'accepted'::text) AND (((user_connections.requester_id = auth.uid()) AND (user_connections.addressee_id = messages.recipient_id)) OR ((user_connections.addressee_id = auth.uid()) AND (user_connections.requester_id = messages.recipient_id)))))))));


--
-- Name: user_follows Users can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: post_likes Users can unlike posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trip_likes Users can unlike trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike trips" ON public.trip_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_saves Users can unsave posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unsave posts" ON public.post_saves FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: photo_albums Users can update own albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own albums" ON public.photo_albums FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: articles Users can update own articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own articles" ON public.articles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: bookings Users can update own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: post_comments Users can update own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: travel_group_members Users can update own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own membership" ON public.travel_group_members FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: posts Users can update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: trip_segments Users can update own trip segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own trip segments" ON public.trip_segments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: trips Users can update own trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_connections Users can update received connection requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update received connection requests" ON public.user_connections FOR UPDATE USING ((auth.uid() = addressee_id)) WITH CHECK ((auth.uid() = addressee_id));


--
-- Name: messages Users can update received messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update received messages" ON public.messages FOR UPDATE USING ((auth.uid() = recipient_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: photos Users can upload photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: photo_albums Users can view own albums; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own albums" ON public.photo_albums FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: trips Users can view own and public trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own and public trips" ON public.trips FOR SELECT USING (((is_public = true) OR (auth.uid() = user_id)));


--
-- Name: bookings Users can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: bucket_list Users can view own bucket list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bucket list" ON public.bucket_list FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: photos Users can view own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own photos" ON public.photos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: post_saves Users can view own saves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own saves" ON public.post_saves FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ticket_verifications Users can view own ticket verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own ticket verifications" ON public.ticket_verifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = ticket_verifications.booking_id) AND (bookings.user_id = auth.uid())))));


--
-- Name: trip_segments Users can view own trip segments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own trip segments" ON public.trip_segments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view public profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public profiles" ON public.profiles FOR SELECT USING (((is_public = true) OR (auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.user_connections
  WHERE ((user_connections.status = 'accepted'::text) AND (((user_connections.requester_id = auth.uid()) AND (user_connections.addressee_id = profiles.id)) OR ((user_connections.addressee_id = auth.uid()) AND (user_connections.requester_id = profiles.id))))))));


--
-- Name: bookings Users can view shared trip bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view shared trip bookings" ON public.bookings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.trip_shares
  WHERE ((trip_shares.trip_group_id = bookings.trip_group_id) AND (trip_shares.status = 'accepted'::text) AND ((trip_shares.shared_with_user_id = auth.uid()) OR (trip_shares.shared_with_email = ( SELECT profiles.email
           FROM public.profiles
          WHERE (profiles.id = auth.uid()))))))));


--
-- Name: user_connections Users can view their own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own connections" ON public.user_connections FOR SELECT USING (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: bucket_list; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;

--
-- Name: group_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

--
-- Name: photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: post_saves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_group_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travel_group_members ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.travel_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: trip_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trip_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: trip_segments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trip_segments ENABLE ROW LEVEL SECURITY;

--
-- Name: trip_shares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: trips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

--
-- Name: user_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;