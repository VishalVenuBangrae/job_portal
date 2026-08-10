import User from '../models/User.js';

const ALLOWED_POSITIONS = ['Chef', 'Interior', 'Chief Stew', 'Engineer', 'Deck hand', 'Mate', 'Exterior'];
const ALLOWED_EXPERIENCE = ['Green', '6 months - 1 year', '1 year +'];
const ALLOWED_KEYWORDS = [
  'Interior Detailing', 'Heads/Beds', 'Laundry', 'Inventory', 'Galley',
  'Teak', 'Tender Operation', 'Exterior Detailing', 'Polishing Stainless'
];
const ALLOWED_DURATION = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days'];

const parseJsonField = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const fileMeta = (doc) => {
  if (!doc?.data) return null;
  return {
    originalName: doc.originalName,
    contentType: doc.contentType,
    uploaded: true
  };
};

export const getCrewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cp = user.crewProfile || {};
    const emailVerificationRequired = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    res.json({
      email: user.email,
      emailVerified: user.emailVerified,
      emailVerificationRequired,
      phone: user.phone,
      profileComplete: cp.profileComplete || false,
      profileStatus: cp.profileStatus || 'active',
      profileLastActive: cp.profileLastActive,
      firstName: cp.firstName || '',
      lastName: cp.lastName || '',
      phoneWhatsApp: cp.phoneWhatsApp || false,
      alternatePhone: cp.alternatePhone || '',
      alternatePhoneWhatsApp: cp.alternatePhoneWhatsApp || false,
      positions: cp.positions || [],
      currentLocation: cp.currentLocation || {
        city: '',
        state: '',
        country: '',
        port: '',
        displayName: ''
      },
      duration: cp.duration || '',
      nationality: cp.nationality || '',
      usWorkAuthorization: cp.usWorkAuthorization || '',
      experience: cp.experience || [],
      keywords: cp.keywords || [],
      documents: {
        cv: fileMeta(cp.documents?.cv),
        stcw: fileMeta(cp.documents?.stcw),
        eng1: fileMeta(cp.documents?.eng1),
        references: fileMeta(cp.documents?.references),
        passport: fileMeta(cp.documents?.passport),
        driversLicense: fileMeta(cp.documents?.driversLicense),
        additionalCertificates: (cp.documents?.additionalCertificates || []).map((cert) => ({
          name: cert.name,
          originalName: cert.originalName,
          contentType: cert.contentType,
          uploaded: true
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveCrewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      firstName,
      lastName,
      email,
      confirmEmail,
      phone,
      phoneWhatsApp,
      alternatePhone,
      alternatePhoneWhatsApp,
      locationCity,
      locationState,
      locationCountry,
      locationPort,
      duration,
      nationality,
      usWorkAuthorization,
      profileStatus
    } = req.body;

    const positions = parseJsonField(req.body.positions);
    const experience = parseJsonField(req.body.experience);
    const keywords = parseJsonField(req.body.keywords);
    const additionalCertificateNames = parseJsonField(req.body.additionalCertificateNames);
    const keepAdditionalIndices = parseJsonField(req.body.keepAdditionalIndices);

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'First and last name are required' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (email.trim().toLowerCase() !== (confirmEmail || '').trim().toLowerCase()) {
      return res.status(400).json({ message: 'Email addresses do not match' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!positions.length) {
      return res.status(400).json({ message: 'Select at least one position' });
    }
    if (positions.length > 3) {
      return res.status(400).json({ message: 'You can select up to 3 positions' });
    }
    if (positions.some((p) => !ALLOWED_POSITIONS.includes(p))) {
      return res.status(400).json({ message: 'Invalid position selected' });
    }
    const resolvedLocation = {
      city: (locationCity || '').trim(),
      state: (locationState || '').trim(),
      country: (locationCountry || '').trim(),
      port: (locationPort || '').trim()
    };

    if (!resolvedLocation.city || !resolvedLocation.country || !resolvedLocation.port) {
      return res.status(400).json({ message: 'Current location must include city, country, and port' });
    }
    resolvedLocation.displayName = [
      resolvedLocation.city,
      resolvedLocation.state ? `(${resolvedLocation.state})` : null,
      resolvedLocation.country,
      resolvedLocation.port
    ].filter(Boolean).join(', ');
    if (!duration || !ALLOWED_DURATION.includes(duration)) {
      return res.status(400).json({ message: 'Duration is required' });
    }
    if (!nationality || !['US', 'Non-US'].includes(nationality)) {
      return res.status(400).json({ message: 'Nationality is required' });
    }
    if (nationality === 'Non-US' && !['B1/B2', 'Green Card'].includes(usWorkAuthorization)) {
      return res.status(400).json({ message: 'B1/B2 or Green Card selection is required for Non-US nationality' });
    }
    if (!experience.length) {
      return res.status(400).json({ message: 'Select at least one experience level' });
    }
    if (experience.some((e) => !ALLOWED_EXPERIENCE.includes(e))) {
      return res.status(400).json({ message: 'Invalid experience selection' });
    }
    if (keywords.some((k) => !ALLOWED_KEYWORDS.includes(k))) {
      return res.status(400).json({ message: 'Invalid keyword selected' });
    }

    if (!user.crewProfile) user.crewProfile = {};
    if (!user.crewProfile.documents) user.crewProfile.documents = {};

    const files = req.files || [];
    const fileMap = {};
    files.forEach((file) => {
      fileMap[file.fieldname] = file;
    });

    const applyFile = (field, required = false) => {
      const file = fileMap[field];
      if (file) {
        user.crewProfile.documents[field] = {
          data: file.buffer,
          contentType: file.mimetype,
          originalName: file.originalname
        };
      } else if (required && !user.crewProfile.documents[field]?.data) {
        throw new Error(`${field.toUpperCase()} upload is required`);
      }
    };

    try {
      applyFile('cv', true);
      applyFile('stcw', true);
      applyFile('eng1', true);
      applyFile('references', true);
      applyFile('passport', true);
      applyFile('driversLicense', false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const existingCerts = user.crewProfile.documents.additionalCertificates || [];
    const keptCerts = existingCerts.filter((_, index) =>
      keepAdditionalIndices.includes(index)
    );

    const newCertFiles = files.filter((f) => f.fieldname === 'additionalCertificates');
    const newCerts = newCertFiles.map((file, i) => ({
      name: additionalCertificateNames[i] || file.originalname,
      data: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname
    }));

    user.crewProfile.documents.additionalCertificates = [...keptCerts, ...newCerts];

    user.name = `${firstName.trim()} ${lastName.trim()}`;
    user.email = email.trim().toLowerCase();
    user.phone = phone.trim();
    user.crewProfile.firstName = firstName.trim();
    user.crewProfile.lastName = lastName.trim();
    user.crewProfile.phoneWhatsApp = phoneWhatsApp === 'true' || phoneWhatsApp === true;
    user.crewProfile.alternatePhone = alternatePhone?.trim() || '';
    user.crewProfile.alternatePhoneWhatsApp = alternatePhoneWhatsApp === 'true' || alternatePhoneWhatsApp === true;
    user.crewProfile.positions = positions;
    user.crewProfile.currentLocation = resolvedLocation;
    user.crewProfile.duration = duration;
    user.crewProfile.nationality = nationality;
    user.crewProfile.usWorkAuthorization = nationality === 'Non-US' ? usWorkAuthorization : undefined;
    user.crewProfile.experience = experience;
    user.crewProfile.keywords = keywords;
    user.crewProfile.profileComplete = true;
    user.crewProfile.profileStatus = profileStatus === 'inactive' ? 'inactive' : 'active';
    user.crewProfile.profileLastActive = new Date();
    user.crewProfile.profileReminderSentAt = undefined;

    await user.save();

    res.json({
      message: 'Profile saved successfully',
      profileComplete: true,
      profileStatus: user.crewProfile.profileStatus
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use by another account' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateProfileStatus = async (req, res) => {
  try {
    const { profileStatus } = req.body;
    if (!['active', 'inactive'].includes(profileStatus)) {
      return res.status(400).json({ message: 'Status must be active or inactive' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.crewProfile?.profileComplete) {
      return res.status(400).json({ message: 'Complete your profile before changing status' });
    }

    user.crewProfile.profileStatus = profileStatus;
    user.crewProfile.profileLastActive = new Date();
    if (profileStatus === 'active') {
      user.crewProfile.profileReminderSentAt = undefined;
    }
    await user.save();

    res.json({
      profileStatus: user.crewProfile.profileStatus,
      profileLastActive: user.crewProfile.profileLastActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfileDocument = async (req, res) => {
  try {
    const { docType, index } = req.params;
    const user = await User.findById(req.user._id);
    if (!user?.crewProfile?.documents) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let doc;
    if (docType === 'additional') {
      doc = user.crewProfile.documents.additionalCertificates?.[parseInt(index, 10)];
    } else {
      doc = user.crewProfile.documents[docType];
    }

    if (!doc?.data) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.set('Content-Type', doc.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${doc.originalName || docType}"`);
    res.send(doc.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
