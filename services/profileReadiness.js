// Old profiles need the newly required matching fields before re-entering the portal.
export const profileReady = (cp) =>
  !!(
    cp?.profileComplete &&
    cp.primaryPosition &&
    cp.availability?.mode &&
    cp.workTypes?.length &&
    cp.workEligibilityCountries?.length &&
    cp.contactPreferences?.length
  );
