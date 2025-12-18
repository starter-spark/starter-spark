create type "public"."user_role" as enum ('admin', 'staff', 'user');
create table "public"."comment_votes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "comment_id" uuid not null,
    "user_id" uuid not null,
    "vote_type" integer not null,
    "created_at" timestamp with time zone default now()
      );
alter table "public"."comment_votes" enable row level security;
create table "public"."comments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "post_id" uuid not null,
    "content" text not null,
    "author_id" uuid not null,
    "is_staff_reply" boolean default false,
    "created_at" timestamp with time zone default now(),
    "is_verified_answer" boolean not null default false,
    "upvotes" integer not null default 0,
    "parent_id" uuid,
    "updated_at" timestamp with time zone default now()
      );
alter table "public"."comments" enable row level security;
create table "public"."courses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "product_id" uuid not null,
    "title" text not null,
    "description" text,
    "difficulty" text not null default 'beginner'::text,
    "duration_minutes" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );
alter table "public"."courses" enable row level security;
create table "public"."events" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "slug" text not null,
    "title" text not null,
    "description" text,
    "location" text not null,
    "address" text,
    "event_date" timestamp with time zone not null,
    "end_date" timestamp with time zone,
    "event_type" text not null default 'workshop'::text,
    "rsvp_url" text,
    "image_url" text,
    "capacity" integer,
    "is_public" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );
alter table "public"."events" enable row level security;
create table "public"."lesson_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "lesson_id" uuid not null,
    "completed_at" timestamp with time zone default now()
      );
alter table "public"."lesson_progress" enable row level security;
create table "public"."lessons" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "module_id" uuid not null,
    "slug" text not null,
    "title" text not null,
    "description" text,
    "duration_minutes" integer not null default 10,
    "content" text not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );
alter table "public"."lessons" enable row level security;
create table "public"."licenses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "code" text not null,
    "product_id" uuid not null,
    "owner_id" uuid,
    "source" text,
    "stripe_session_id" text,
    "created_at" timestamp with time zone default now(),
    "claim_token" text,
    "customer_email" text,
    "claimed_at" timestamp with time zone
      );
alter table "public"."licenses" enable row level security;
create table "public"."modules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "course_id" uuid not null,
    "title" text not null,
    "description" text,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone default now()
      );
alter table "public"."modules" enable row level security;
create table "public"."post_votes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "vote_type" integer not null,
    "created_at" timestamp with time zone default now()
      );
alter table "public"."post_votes" enable row level security;
create table "public"."posts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "content" text not null,
    "author_id" uuid not null,
    "tags" text[] default ARRAY[]::text[],
    "upvotes" integer default 0,
    "created_at" timestamp with time zone default now(),
    "status" text not null default 'open'::text,
    "product_id" uuid,
    "slug" text,
    "view_count" integer not null default 0,
    "updated_at" timestamp with time zone default now()
      );
alter table "public"."posts" enable row level security;
create table "public"."products" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "slug" text not null,
    "name" text not null,
    "description" text,
    "price_cents" integer not null,
    "stripe_price_id" text,
    "specs" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );
alter table "public"."products" enable row level security;
create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "role" public.user_role default 'user'::public.user_role,
    "created_at" timestamp with time zone default now()
      );
alter table "public"."profiles" enable row level security;
CREATE UNIQUE INDEX comment_votes_comment_id_user_id_key ON public.comment_votes USING btree (comment_id, user_id);
CREATE UNIQUE INDEX comment_votes_pkey ON public.comment_votes USING btree (id);
CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);
CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);
CREATE INDEX events_event_date_idx ON public.events USING btree (event_date);
CREATE INDEX events_event_type_idx ON public.events USING btree (event_type);
CREATE INDEX events_is_public_idx ON public.events USING btree (is_public);
CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);
CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug);
CREATE INDEX idx_comments_is_verified ON public.comments USING btree (post_id) WHERE (is_verified_answer = true);
CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);
CREATE INDEX idx_courses_product_id ON public.courses USING btree (product_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);
CREATE INDEX idx_lesson_progress_user_id ON public.lesson_progress USING btree (user_id);
CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);
CREATE INDEX idx_lessons_slug ON public.lessons USING btree (module_id, slug);
CREATE INDEX idx_lessons_sort_order ON public.lessons USING btree (module_id, sort_order);
CREATE INDEX idx_licenses_claim_token ON public.licenses USING btree (claim_token) WHERE (claim_token IS NOT NULL);
CREATE INDEX idx_licenses_customer_email ON public.licenses USING btree (customer_email) WHERE (customer_email IS NOT NULL);
CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);
CREATE INDEX idx_modules_sort_order ON public.modules USING btree (course_id, sort_order);
CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);
CREATE INDEX idx_posts_product_id ON public.posts USING btree (product_id);
CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);
CREATE INDEX idx_posts_status ON public.posts USING btree (status);
CREATE UNIQUE INDEX lesson_progress_pkey ON public.lesson_progress USING btree (id);
CREATE UNIQUE INDEX lesson_progress_user_id_lesson_id_key ON public.lesson_progress USING btree (user_id, lesson_id);
CREATE UNIQUE INDEX lessons_module_id_slug_key ON public.lessons USING btree (module_id, slug);
CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);
CREATE UNIQUE INDEX licenses_claim_token_key ON public.licenses USING btree (claim_token);
CREATE INDEX licenses_code_idx ON public.licenses USING btree (code);
CREATE UNIQUE INDEX licenses_code_key ON public.licenses USING btree (code);
CREATE INDEX licenses_code_lower_idx ON public.licenses USING btree (lower(code));
CREATE INDEX licenses_owner_idx ON public.licenses USING btree (owner_id);
CREATE UNIQUE INDEX licenses_pkey ON public.licenses USING btree (id);
CREATE UNIQUE INDEX licenses_stripe_session_id_key ON public.licenses USING btree (stripe_session_id);
CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);
CREATE UNIQUE INDEX post_votes_pkey ON public.post_votes USING btree (id);
CREATE UNIQUE INDEX post_votes_post_id_user_id_key ON public.post_votes USING btree (post_id, user_id);
CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at DESC);
CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);
CREATE UNIQUE INDEX posts_slug_key ON public.posts USING btree (slug);
CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);
CREATE INDEX products_slug_idx ON public.products USING btree (slug);
CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
alter table "public"."comment_votes" add constraint "comment_votes_pkey" PRIMARY KEY using index "comment_votes_pkey";
alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";
alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";
alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";
alter table "public"."lesson_progress" add constraint "lesson_progress_pkey" PRIMARY KEY using index "lesson_progress_pkey";
alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";
alter table "public"."licenses" add constraint "licenses_pkey" PRIMARY KEY using index "licenses_pkey";
alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";
alter table "public"."post_votes" add constraint "post_votes_pkey" PRIMARY KEY using index "post_votes_pkey";
alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";
alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";
alter table "public"."comment_votes" add constraint "comment_votes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;
alter table "public"."comment_votes" validate constraint "comment_votes_comment_id_fkey";
alter table "public"."comment_votes" add constraint "comment_votes_comment_id_user_id_key" UNIQUE using index "comment_votes_comment_id_user_id_key";
alter table "public"."comment_votes" add constraint "comment_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;
alter table "public"."comment_votes" validate constraint "comment_votes_user_id_fkey";
alter table "public"."comment_votes" add constraint "comment_votes_vote_type_check" CHECK ((vote_type = ANY (ARRAY['-1'::integer, 1]))) not valid;
alter table "public"."comment_votes" validate constraint "comment_votes_vote_type_check";
alter table "public"."comments" add constraint "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) not valid;
alter table "public"."comments" validate constraint "comments_author_id_fkey";
alter table "public"."comments" add constraint "comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;
alter table "public"."comments" validate constraint "comments_parent_id_fkey";
alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;
alter table "public"."comments" validate constraint "comments_post_id_fkey";
alter table "public"."courses" add constraint "courses_difficulty_check" CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;
alter table "public"."courses" validate constraint "courses_difficulty_check";
alter table "public"."courses" add constraint "courses_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;
alter table "public"."courses" validate constraint "courses_product_id_fkey";
alter table "public"."events" add constraint "events_event_type_check" CHECK ((event_type = ANY (ARRAY['workshop'::text, 'competition'::text, 'meetup'::text, 'exhibition'::text, 'other'::text]))) not valid;
alter table "public"."events" validate constraint "events_event_type_check";
alter table "public"."events" add constraint "events_slug_key" UNIQUE using index "events_slug_key";
alter table "public"."lesson_progress" add constraint "lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;
alter table "public"."lesson_progress" validate constraint "lesson_progress_lesson_id_fkey";
alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;
alter table "public"."lesson_progress" validate constraint "lesson_progress_user_id_fkey";
alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_lesson_id_key" UNIQUE using index "lesson_progress_user_id_lesson_id_key";
alter table "public"."lessons" add constraint "lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE not valid;
alter table "public"."lessons" validate constraint "lessons_module_id_fkey";
alter table "public"."lessons" add constraint "lessons_module_id_slug_key" UNIQUE using index "lessons_module_id_slug_key";
alter table "public"."licenses" add constraint "licenses_claim_token_key" UNIQUE using index "licenses_claim_token_key";
alter table "public"."licenses" add constraint "licenses_code_key" UNIQUE using index "licenses_code_key";
alter table "public"."licenses" add constraint "licenses_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) not valid;
alter table "public"."licenses" validate constraint "licenses_owner_id_fkey";
alter table "public"."licenses" add constraint "licenses_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;
alter table "public"."licenses" validate constraint "licenses_product_id_fkey";
alter table "public"."licenses" add constraint "licenses_source_check" CHECK ((source = ANY (ARRAY['online_purchase'::text, 'physical_card'::text]))) not valid;
alter table "public"."licenses" validate constraint "licenses_source_check";
alter table "public"."licenses" add constraint "licenses_stripe_session_id_key" UNIQUE using index "licenses_stripe_session_id_key";
alter table "public"."modules" add constraint "modules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;
alter table "public"."modules" validate constraint "modules_course_id_fkey";
alter table "public"."post_votes" add constraint "post_votes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;
alter table "public"."post_votes" validate constraint "post_votes_post_id_fkey";
alter table "public"."post_votes" add constraint "post_votes_post_id_user_id_key" UNIQUE using index "post_votes_post_id_user_id_key";
alter table "public"."post_votes" add constraint "post_votes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;
alter table "public"."post_votes" validate constraint "post_votes_user_id_fkey";
alter table "public"."post_votes" add constraint "post_votes_vote_type_check" CHECK ((vote_type = ANY (ARRAY['-1'::integer, 1]))) not valid;
alter table "public"."post_votes" validate constraint "post_votes_vote_type_check";
alter table "public"."posts" add constraint "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) not valid;
alter table "public"."posts" validate constraint "posts_author_id_fkey";
alter table "public"."posts" add constraint "posts_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;
alter table "public"."posts" validate constraint "posts_product_id_fkey";
alter table "public"."posts" add constraint "posts_slug_key" UNIQUE using index "posts_slug_key";
alter table "public"."posts" add constraint "posts_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'solved'::text, 'unanswered'::text]))) not valid;
alter table "public"."posts" validate constraint "posts_status_check";
alter table "public"."products" add constraint "products_slug_key" UNIQUE using index "products_slug_key";
alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."profiles" validate constraint "profiles_id_fkey";
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.generate_post_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := SUBSTRING(base_slug FROM 1 FOR 50);
  
  new_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_course_progress(p_course_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;
  
  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress lp
  JOIN lessons l ON lp.lesson_id = l.id
  JOIN modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id
  AND lp.user_id = p_user_id;
  
  RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  );
$function$;
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_post_status_on_verified_answer()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_verified_answer = TRUE THEN
    UPDATE posts SET status = 'solved', updated_at = NOW() WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.user_owns_product(p_product_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM licenses
    WHERE owner_id = (SELECT auth.uid())
    AND product_id = p_product_id
  );
END;
$function$;
grant delete on table "public"."comment_votes" to "anon";
grant insert on table "public"."comment_votes" to "anon";
grant references on table "public"."comment_votes" to "anon";
grant select on table "public"."comment_votes" to "anon";
grant trigger on table "public"."comment_votes" to "anon";
grant truncate on table "public"."comment_votes" to "anon";
grant update on table "public"."comment_votes" to "anon";
grant delete on table "public"."comment_votes" to "authenticated";
grant insert on table "public"."comment_votes" to "authenticated";
grant references on table "public"."comment_votes" to "authenticated";
grant select on table "public"."comment_votes" to "authenticated";
grant trigger on table "public"."comment_votes" to "authenticated";
grant truncate on table "public"."comment_votes" to "authenticated";
grant update on table "public"."comment_votes" to "authenticated";
grant delete on table "public"."comment_votes" to "postgres";
grant insert on table "public"."comment_votes" to "postgres";
grant references on table "public"."comment_votes" to "postgres";
grant select on table "public"."comment_votes" to "postgres";
grant trigger on table "public"."comment_votes" to "postgres";
grant truncate on table "public"."comment_votes" to "postgres";
grant update on table "public"."comment_votes" to "postgres";
grant delete on table "public"."comment_votes" to "service_role";
grant insert on table "public"."comment_votes" to "service_role";
grant references on table "public"."comment_votes" to "service_role";
grant select on table "public"."comment_votes" to "service_role";
grant trigger on table "public"."comment_votes" to "service_role";
grant truncate on table "public"."comment_votes" to "service_role";
grant update on table "public"."comment_votes" to "service_role";
grant delete on table "public"."comments" to "anon";
grant insert on table "public"."comments" to "anon";
grant references on table "public"."comments" to "anon";
grant select on table "public"."comments" to "anon";
grant trigger on table "public"."comments" to "anon";
grant truncate on table "public"."comments" to "anon";
grant update on table "public"."comments" to "anon";
grant delete on table "public"."comments" to "authenticated";
grant insert on table "public"."comments" to "authenticated";
grant references on table "public"."comments" to "authenticated";
grant select on table "public"."comments" to "authenticated";
grant trigger on table "public"."comments" to "authenticated";
grant truncate on table "public"."comments" to "authenticated";
grant update on table "public"."comments" to "authenticated";
grant delete on table "public"."comments" to "postgres";
grant insert on table "public"."comments" to "postgres";
grant references on table "public"."comments" to "postgres";
grant select on table "public"."comments" to "postgres";
grant trigger on table "public"."comments" to "postgres";
grant truncate on table "public"."comments" to "postgres";
grant update on table "public"."comments" to "postgres";
grant delete on table "public"."comments" to "service_role";
grant insert on table "public"."comments" to "service_role";
grant references on table "public"."comments" to "service_role";
grant select on table "public"."comments" to "service_role";
grant trigger on table "public"."comments" to "service_role";
grant truncate on table "public"."comments" to "service_role";
grant update on table "public"."comments" to "service_role";
grant delete on table "public"."courses" to "anon";
grant insert on table "public"."courses" to "anon";
grant references on table "public"."courses" to "anon";
grant select on table "public"."courses" to "anon";
grant trigger on table "public"."courses" to "anon";
grant truncate on table "public"."courses" to "anon";
grant update on table "public"."courses" to "anon";
grant delete on table "public"."courses" to "authenticated";
grant insert on table "public"."courses" to "authenticated";
grant references on table "public"."courses" to "authenticated";
grant select on table "public"."courses" to "authenticated";
grant trigger on table "public"."courses" to "authenticated";
grant truncate on table "public"."courses" to "authenticated";
grant update on table "public"."courses" to "authenticated";
grant delete on table "public"."courses" to "postgres";
grant insert on table "public"."courses" to "postgres";
grant references on table "public"."courses" to "postgres";
grant select on table "public"."courses" to "postgres";
grant trigger on table "public"."courses" to "postgres";
grant truncate on table "public"."courses" to "postgres";
grant update on table "public"."courses" to "postgres";
grant delete on table "public"."courses" to "service_role";
grant insert on table "public"."courses" to "service_role";
grant references on table "public"."courses" to "service_role";
grant select on table "public"."courses" to "service_role";
grant trigger on table "public"."courses" to "service_role";
grant truncate on table "public"."courses" to "service_role";
grant update on table "public"."courses" to "service_role";
grant delete on table "public"."events" to "anon";
grant insert on table "public"."events" to "anon";
grant references on table "public"."events" to "anon";
grant select on table "public"."events" to "anon";
grant trigger on table "public"."events" to "anon";
grant truncate on table "public"."events" to "anon";
grant update on table "public"."events" to "anon";
grant delete on table "public"."events" to "authenticated";
grant insert on table "public"."events" to "authenticated";
grant references on table "public"."events" to "authenticated";
grant select on table "public"."events" to "authenticated";
grant trigger on table "public"."events" to "authenticated";
grant truncate on table "public"."events" to "authenticated";
grant update on table "public"."events" to "authenticated";
grant delete on table "public"."events" to "postgres";
grant insert on table "public"."events" to "postgres";
grant references on table "public"."events" to "postgres";
grant select on table "public"."events" to "postgres";
grant trigger on table "public"."events" to "postgres";
grant truncate on table "public"."events" to "postgres";
grant update on table "public"."events" to "postgres";
grant delete on table "public"."events" to "service_role";
grant insert on table "public"."events" to "service_role";
grant references on table "public"."events" to "service_role";
grant select on table "public"."events" to "service_role";
grant trigger on table "public"."events" to "service_role";
grant truncate on table "public"."events" to "service_role";
grant update on table "public"."events" to "service_role";
grant delete on table "public"."lesson_progress" to "anon";
grant insert on table "public"."lesson_progress" to "anon";
grant references on table "public"."lesson_progress" to "anon";
grant select on table "public"."lesson_progress" to "anon";
grant trigger on table "public"."lesson_progress" to "anon";
grant truncate on table "public"."lesson_progress" to "anon";
grant update on table "public"."lesson_progress" to "anon";
grant delete on table "public"."lesson_progress" to "authenticated";
grant insert on table "public"."lesson_progress" to "authenticated";
grant references on table "public"."lesson_progress" to "authenticated";
grant select on table "public"."lesson_progress" to "authenticated";
grant trigger on table "public"."lesson_progress" to "authenticated";
grant truncate on table "public"."lesson_progress" to "authenticated";
grant update on table "public"."lesson_progress" to "authenticated";
grant delete on table "public"."lesson_progress" to "postgres";
grant insert on table "public"."lesson_progress" to "postgres";
grant references on table "public"."lesson_progress" to "postgres";
grant select on table "public"."lesson_progress" to "postgres";
grant trigger on table "public"."lesson_progress" to "postgres";
grant truncate on table "public"."lesson_progress" to "postgres";
grant update on table "public"."lesson_progress" to "postgres";
grant delete on table "public"."lesson_progress" to "service_role";
grant insert on table "public"."lesson_progress" to "service_role";
grant references on table "public"."lesson_progress" to "service_role";
grant select on table "public"."lesson_progress" to "service_role";
grant trigger on table "public"."lesson_progress" to "service_role";
grant truncate on table "public"."lesson_progress" to "service_role";
grant update on table "public"."lesson_progress" to "service_role";
grant delete on table "public"."lessons" to "anon";
grant insert on table "public"."lessons" to "anon";
grant references on table "public"."lessons" to "anon";
grant select on table "public"."lessons" to "anon";
grant trigger on table "public"."lessons" to "anon";
grant truncate on table "public"."lessons" to "anon";
grant update on table "public"."lessons" to "anon";
grant delete on table "public"."lessons" to "authenticated";
grant insert on table "public"."lessons" to "authenticated";
grant references on table "public"."lessons" to "authenticated";
grant select on table "public"."lessons" to "authenticated";
grant trigger on table "public"."lessons" to "authenticated";
grant truncate on table "public"."lessons" to "authenticated";
grant update on table "public"."lessons" to "authenticated";
grant delete on table "public"."lessons" to "postgres";
grant insert on table "public"."lessons" to "postgres";
grant references on table "public"."lessons" to "postgres";
grant select on table "public"."lessons" to "postgres";
grant trigger on table "public"."lessons" to "postgres";
grant truncate on table "public"."lessons" to "postgres";
grant update on table "public"."lessons" to "postgres";
grant delete on table "public"."lessons" to "service_role";
grant insert on table "public"."lessons" to "service_role";
grant references on table "public"."lessons" to "service_role";
grant select on table "public"."lessons" to "service_role";
grant trigger on table "public"."lessons" to "service_role";
grant truncate on table "public"."lessons" to "service_role";
grant update on table "public"."lessons" to "service_role";
grant delete on table "public"."licenses" to "anon";
grant insert on table "public"."licenses" to "anon";
grant references on table "public"."licenses" to "anon";
grant select on table "public"."licenses" to "anon";
grant trigger on table "public"."licenses" to "anon";
grant truncate on table "public"."licenses" to "anon";
grant update on table "public"."licenses" to "anon";
grant delete on table "public"."licenses" to "authenticated";
grant insert on table "public"."licenses" to "authenticated";
grant references on table "public"."licenses" to "authenticated";
grant select on table "public"."licenses" to "authenticated";
grant trigger on table "public"."licenses" to "authenticated";
grant truncate on table "public"."licenses" to "authenticated";
grant update on table "public"."licenses" to "authenticated";
grant delete on table "public"."licenses" to "postgres";
grant insert on table "public"."licenses" to "postgres";
grant references on table "public"."licenses" to "postgres";
grant select on table "public"."licenses" to "postgres";
grant trigger on table "public"."licenses" to "postgres";
grant truncate on table "public"."licenses" to "postgres";
grant update on table "public"."licenses" to "postgres";
grant delete on table "public"."licenses" to "service_role";
grant insert on table "public"."licenses" to "service_role";
grant references on table "public"."licenses" to "service_role";
grant select on table "public"."licenses" to "service_role";
grant trigger on table "public"."licenses" to "service_role";
grant truncate on table "public"."licenses" to "service_role";
grant update on table "public"."licenses" to "service_role";
grant delete on table "public"."modules" to "anon";
grant insert on table "public"."modules" to "anon";
grant references on table "public"."modules" to "anon";
grant select on table "public"."modules" to "anon";
grant trigger on table "public"."modules" to "anon";
grant truncate on table "public"."modules" to "anon";
grant update on table "public"."modules" to "anon";
grant delete on table "public"."modules" to "authenticated";
grant insert on table "public"."modules" to "authenticated";
grant references on table "public"."modules" to "authenticated";
grant select on table "public"."modules" to "authenticated";
grant trigger on table "public"."modules" to "authenticated";
grant truncate on table "public"."modules" to "authenticated";
grant update on table "public"."modules" to "authenticated";
grant delete on table "public"."modules" to "postgres";
grant insert on table "public"."modules" to "postgres";
grant references on table "public"."modules" to "postgres";
grant select on table "public"."modules" to "postgres";
grant trigger on table "public"."modules" to "postgres";
grant truncate on table "public"."modules" to "postgres";
grant update on table "public"."modules" to "postgres";
grant delete on table "public"."modules" to "service_role";
grant insert on table "public"."modules" to "service_role";
grant references on table "public"."modules" to "service_role";
grant select on table "public"."modules" to "service_role";
grant trigger on table "public"."modules" to "service_role";
grant truncate on table "public"."modules" to "service_role";
grant update on table "public"."modules" to "service_role";
grant delete on table "public"."post_votes" to "anon";
grant insert on table "public"."post_votes" to "anon";
grant references on table "public"."post_votes" to "anon";
grant select on table "public"."post_votes" to "anon";
grant trigger on table "public"."post_votes" to "anon";
grant truncate on table "public"."post_votes" to "anon";
grant update on table "public"."post_votes" to "anon";
grant delete on table "public"."post_votes" to "authenticated";
grant insert on table "public"."post_votes" to "authenticated";
grant references on table "public"."post_votes" to "authenticated";
grant select on table "public"."post_votes" to "authenticated";
grant trigger on table "public"."post_votes" to "authenticated";
grant truncate on table "public"."post_votes" to "authenticated";
grant update on table "public"."post_votes" to "authenticated";
grant delete on table "public"."post_votes" to "postgres";
grant insert on table "public"."post_votes" to "postgres";
grant references on table "public"."post_votes" to "postgres";
grant select on table "public"."post_votes" to "postgres";
grant trigger on table "public"."post_votes" to "postgres";
grant truncate on table "public"."post_votes" to "postgres";
grant update on table "public"."post_votes" to "postgres";
grant delete on table "public"."post_votes" to "service_role";
grant insert on table "public"."post_votes" to "service_role";
grant references on table "public"."post_votes" to "service_role";
grant select on table "public"."post_votes" to "service_role";
grant trigger on table "public"."post_votes" to "service_role";
grant truncate on table "public"."post_votes" to "service_role";
grant update on table "public"."post_votes" to "service_role";
grant delete on table "public"."posts" to "anon";
grant insert on table "public"."posts" to "anon";
grant references on table "public"."posts" to "anon";
grant select on table "public"."posts" to "anon";
grant trigger on table "public"."posts" to "anon";
grant truncate on table "public"."posts" to "anon";
grant update on table "public"."posts" to "anon";
grant delete on table "public"."posts" to "authenticated";
grant insert on table "public"."posts" to "authenticated";
grant references on table "public"."posts" to "authenticated";
grant select on table "public"."posts" to "authenticated";
grant trigger on table "public"."posts" to "authenticated";
grant truncate on table "public"."posts" to "authenticated";
grant update on table "public"."posts" to "authenticated";
grant delete on table "public"."posts" to "postgres";
grant insert on table "public"."posts" to "postgres";
grant references on table "public"."posts" to "postgres";
grant select on table "public"."posts" to "postgres";
grant trigger on table "public"."posts" to "postgres";
grant truncate on table "public"."posts" to "postgres";
grant update on table "public"."posts" to "postgres";
grant delete on table "public"."posts" to "service_role";
grant insert on table "public"."posts" to "service_role";
grant references on table "public"."posts" to "service_role";
grant select on table "public"."posts" to "service_role";
grant trigger on table "public"."posts" to "service_role";
grant truncate on table "public"."posts" to "service_role";
grant update on table "public"."posts" to "service_role";
grant delete on table "public"."products" to "anon";
grant insert on table "public"."products" to "anon";
grant references on table "public"."products" to "anon";
grant select on table "public"."products" to "anon";
grant trigger on table "public"."products" to "anon";
grant truncate on table "public"."products" to "anon";
grant update on table "public"."products" to "anon";
grant delete on table "public"."products" to "authenticated";
grant insert on table "public"."products" to "authenticated";
grant references on table "public"."products" to "authenticated";
grant select on table "public"."products" to "authenticated";
grant trigger on table "public"."products" to "authenticated";
grant truncate on table "public"."products" to "authenticated";
grant update on table "public"."products" to "authenticated";
grant delete on table "public"."products" to "postgres";
grant insert on table "public"."products" to "postgres";
grant references on table "public"."products" to "postgres";
grant select on table "public"."products" to "postgres";
grant trigger on table "public"."products" to "postgres";
grant truncate on table "public"."products" to "postgres";
grant update on table "public"."products" to "postgres";
grant delete on table "public"."products" to "service_role";
grant insert on table "public"."products" to "service_role";
grant references on table "public"."products" to "service_role";
grant select on table "public"."products" to "service_role";
grant trigger on table "public"."products" to "service_role";
grant truncate on table "public"."products" to "service_role";
grant update on table "public"."products" to "service_role";
grant delete on table "public"."profiles" to "anon";
grant insert on table "public"."profiles" to "anon";
grant references on table "public"."profiles" to "anon";
grant select on table "public"."profiles" to "anon";
grant trigger on table "public"."profiles" to "anon";
grant truncate on table "public"."profiles" to "anon";
grant update on table "public"."profiles" to "anon";
grant delete on table "public"."profiles" to "authenticated";
grant insert on table "public"."profiles" to "authenticated";
grant references on table "public"."profiles" to "authenticated";
grant select on table "public"."profiles" to "authenticated";
grant trigger on table "public"."profiles" to "authenticated";
grant truncate on table "public"."profiles" to "authenticated";
grant update on table "public"."profiles" to "authenticated";
grant delete on table "public"."profiles" to "postgres";
grant insert on table "public"."profiles" to "postgres";
grant references on table "public"."profiles" to "postgres";
grant select on table "public"."profiles" to "postgres";
grant trigger on table "public"."profiles" to "postgres";
grant truncate on table "public"."profiles" to "postgres";
grant update on table "public"."profiles" to "postgres";
grant delete on table "public"."profiles" to "service_role";
grant insert on table "public"."profiles" to "service_role";
grant references on table "public"."profiles" to "service_role";
grant select on table "public"."profiles" to "service_role";
grant trigger on table "public"."profiles" to "service_role";
grant truncate on table "public"."profiles" to "service_role";
grant update on table "public"."profiles" to "service_role";
create policy "Anyone can view comment votes"
  on "public"."comment_votes"
  as permissive
  for select
  to public
using (true);
create policy "Authenticated users can vote on comments"
  on "public"."comment_votes"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));
create policy "Users can remove their comment votes"
  on "public"."comment_votes"
  as permissive
  for delete
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can update their comment votes"
  on "public"."comment_votes"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Authenticated users can create comments"
  on "public"."comments"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (author_id = ( SELECT auth.uid() AS uid))));
create policy "Authors can delete their comments"
  on "public"."comments"
  as permissive
  for delete
  to public
using ((author_id = ( SELECT auth.uid() AS uid)));
create policy "Authors can update their comments"
  on "public"."comments"
  as permissive
  for update
  to public
using ((author_id = ( SELECT auth.uid() AS uid)));
create policy "Comments are viewable by everyone"
  on "public"."comments"
  as permissive
  for select
  to public
using (true);
create policy "Staff can mark verified answers"
  on "public"."comments"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'staff'::public.user_role]))))));
create policy "Users can delete own comments"
  on "public"."comments"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));
create policy "Users can update own comments"
  on "public"."comments"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));
create policy "Courses are viewable by everyone"
  on "public"."courses"
  as permissive
  for select
  to anon, authenticated
using (true);
create policy "Admins can manage events"
  on "public"."events"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'admin'::public.user_role))
with check ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))) = 'admin'::public.user_role));
create policy "Public events are viewable by everyone"
  on "public"."events"
  as permissive
  for select
  to public
using ((is_public = true));
create policy "Users can insert their own progress"
  on "public"."lesson_progress"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can update their own progress"
  on "public"."lesson_progress"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Users can view their own progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));
create policy "Lesson metadata is viewable by everyone"
  on "public"."lessons"
  as permissive
  for select
  to anon, authenticated
using (true);
create policy "Admins can view all licenses"
  on "public"."licenses"
  as permissive
  for select
  to authenticated
using (( SELECT public.is_admin() AS is_admin));
create policy "Users can view own licenses"
  on "public"."licenses"
  as permissive
  for select
  to public
using ((auth.uid() = owner_id));
create policy "Modules are viewable by everyone"
  on "public"."modules"
  as permissive
  for select
  to anon, authenticated
using (true);
create policy "Anyone can view post votes"
  on "public"."post_votes"
  as permissive
  for select
  to public
using (true);
create policy "Authenticated users can vote on posts"
  on "public"."post_votes"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));
create policy "Users can remove their own votes"
  on "public"."post_votes"
  as permissive
  for delete
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Users can update their own votes"
  on "public"."post_votes"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Authenticated users can create posts"
  on "public"."posts"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (author_id = ( SELECT auth.uid() AS uid))));
create policy "Authors can delete their posts"
  on "public"."posts"
  as permissive
  for delete
  to public
using ((author_id = ( SELECT auth.uid() AS uid)));
create policy "Authors can update their posts"
  on "public"."posts"
  as permissive
  for update
  to public
using ((author_id = ( SELECT auth.uid() AS uid)));
create policy "Posts are viewable by everyone"
  on "public"."posts"
  as permissive
  for select
  to public
using (true);
create policy "Users can delete own posts"
  on "public"."posts"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));
create policy "Users can update own posts"
  on "public"."posts"
  as permissive
  for update
  to public
using ((auth.uid() = author_id));
create policy "Admins can delete products"
  on "public"."products"
  as permissive
  for delete
  to authenticated
using (( SELECT public.is_admin() AS is_admin));
create policy "Admins can insert products"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check (( SELECT public.is_admin() AS is_admin));
create policy "Admins can update products"
  on "public"."products"
  as permissive
  for update
  to authenticated
using (( SELECT public.is_admin() AS is_admin));
create policy "Products are viewable by everyone"
  on "public"."products"
  as permissive
  for select
  to public
using (true);
create policy "Public profiles are viewable by everyone"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);
create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));
CREATE TRIGGER comments_update_post_status AFTER UPDATE OF is_verified_answer ON public.comments FOR EACH ROW WHEN ((new.is_verified_answer = true)) EXECUTE FUNCTION public.update_post_status_on_verified_answer();
CREATE TRIGGER update_events_updated_at_trigger BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_events_updated_at();
CREATE TRIGGER posts_generate_slug BEFORE INSERT ON public.posts FOR EACH ROW WHEN ((new.slug IS NULL)) EXECUTE FUNCTION public.generate_post_slug();
