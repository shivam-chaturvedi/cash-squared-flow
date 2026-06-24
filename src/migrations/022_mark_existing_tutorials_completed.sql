-- Existing users already chose account types before the tutorial flow was expanded.
-- Mark them complete so the new tutorial only appears for new onboarding users.
update public.profiles
set notification_prefs = coalesce(notification_prefs, '{}'::jsonb) || '{"tutorial_completed": true, "tutorial_completed_personal": true, "tutorial_completed_business": true}'::jsonb,
    updated_at = now()
where accepted_terms = true
  and cardinality(coalesce(account_types, array[]::text[])) > 0
  and coalesce((notification_prefs->>'tutorial_completed')::boolean, false) = false
  and coalesce((notification_prefs->>'onboarding_completed')::boolean, false) = false;
