-- Update handle_new_user function to auto-accept pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Auto-accept any pending invitations for this email
  UPDATE public.organization_members
  SET 
    user_id = NEW.id,
    status = 'accepted',
    accepted_at = now()
  WHERE 
    invited_email = NEW.email 
    AND status = 'pending';
  
  RETURN NEW;
END;
$function$;