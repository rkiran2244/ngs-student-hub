-- Add course fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS course_name TEXT,
  ADD COLUMN IF NOT EXISTS course_mode TEXT,
  ADD COLUMN IF NOT EXISTS course_duration TEXT;

-- Update handle_new_user function to include new fields when creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with new fields
  INSERT INTO public.profiles (user_id, full_name, email, contact_number, college_name, college_id, college_email, course_name, course_mode, course_duration)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'contact_number',
    NEW.raw_user_meta_data->>'college_name',
    NEW.raw_user_meta_data->>'college_id',
    NEW.raw_user_meta_data->>'college_email',
    NEW.raw_user_meta_data->>'course_name',
    NEW.raw_user_meta_data->>'course_mode',
    NEW.raw_user_meta_data->>'course_duration'
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;