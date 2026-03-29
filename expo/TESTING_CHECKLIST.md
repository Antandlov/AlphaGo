# Testing Checklist for AlphaGo Upgrades

## ✅ Automated Tests (Already Passing)
- [x] TypeScript compilation (strict mode)
- [x] ESLint linting
- [x] Jest unit tests (12 tests)
- [x] Ingredient checker logic
- [x] Safety verdict calculations

---

## 📱 Manual Testing Required

### 1. Secure Storage Migration
**What to test:**
- [ ] Create a new profile → Close app → Reopen → Profile still exists
- [ ] Delete a profile → Close app → Reopen → Profile deleted
- [ ] Update a profile's allergens → Close app → Reopen → Changes persisted
- [ ] **iOS**: Verify data encrypted (check iOS Keychain)
- [ ] **Android**: Verify data encrypted (check SharedPreferences)
- [ ] **Web**: Verify graceful fallback to AsyncStorage

**Expected behavior**: All profile data persists across app restarts, encrypted on native platforms.

---

### 2. Privacy Consent Modal
**What to test:**
- [ ] **First Launch**: Language selection → ToS → Privacy Consent
- [ ] Decline privacy → App closes gracefully
- [ ] Accept privacy (analytics OFF) → Proceed to app
- [ ] Accept privacy (analytics ON) → Proceed to app
- [ ] Close and reopen → Privacy consent not shown again
- [ ] Uninstall/reinstall → Privacy consent shown again

**Expected behavior**: Modal only appears once, choices are respected.

---

### 3. Voice Readout (expo-speech)
**What to test:**
- [ ] Scan a product → Result screen → Tap 🔊 speaker icon
- [ ] Voice reads: "Safe to Consume. No allergens detected." (for safe product)
- [ ] Voice reads unsafe ingredients list
- [ ] Tap 🔊 again → Voice stops mid-sentence
- [ ] Test on **iOS** (different voice)
- [ ] Test on **Android** (different voice)
- [ ] Test on **Web** (may use browser TTS)
- [ ] Exit result screen while speaking → Voice stops automatically

**Expected behavior**: Clear, audible readout of scan results. Toggle on/off works.

---

### 4. Accessibility
**What to test:**
- [ ] **iOS VoiceOver**: Enable → Navigate app → All buttons announce correctly
- [ ] **Android TalkBack**: Enable → Navigate app → All buttons announce correctly
- [ ] Touch targets are large (44x44pt minimum)
- [ ] High contrast mode works
- [ ] Color-coded verdicts visible to colorblind users

**Expected behavior**: Fully navigable with screen readers.

---

### 5. Error Handling
**What to test:**
- [ ] **No internet**: Try scanning → Should show error message
- [ ] **Camera permission denied**: App shows permission prompt
- [ ] **Invalid image**: Scan blank page → Graceful error
- [ ] **Corrupt storage**: Manually corrupt profile data → App resets gracefully
- [ ] **Speech fails**: Airplane mode + tap voice → Shows error, doesn't crash

**Expected behavior**: No crashes, user-friendly error messages.

---

### 6. Existing Features (Regression Testing)
**What to test:**
- [ ] Create profile with allergens
- [ ] Select multiple profiles for shopping
- [ ] Scan ingredient label
- [ ] Get Green/Yellow/Red verdict
- [ ] View scan history
- [ ] Delete scan from history
- [ ] Change language
- [ ] View Terms of Service
- [ ] Report bug/product
- [ ] Beta feedback form

**Expected behavior**: All existing features work as before.

---

### 7. Platform-Specific
**What to test:**

#### iOS:
- [ ] Haptic feedback works (success/error vibrations)
- [ ] SecureStore uses iOS Keychain
- [ ] Voice readout uses Siri voice
- [ ] Safe area insets correct on iPhone notch
- [ ] Works on iPad (tablet layout)

#### Android:
- [ ] Haptic feedback works
- [ ] SecureStore uses EncryptedSharedPreferences
- [ ] Voice readout uses Google TTS
- [ ] Safe area insets correct
- [ ] Works on various screen sizes

#### Web:
- [ ] Fallback to AsyncStorage (no SecureStore)
- [ ] Camera works (browser permissions)
- [ ] Voice readout uses Web Speech API
- [ ] Responsive layout
- [ ] No native-only crashes

---

### 8. Jest Tests
**What to test:**
```bash
bun test
```

**Expected:**
- [ ] All 12 tests pass
- [ ] No TypeScript errors
- [ ] No import resolution errors
- [ ] Coverage report generated

---

### 9. CI/CD Workflow
**What to test:**
- [ ] Push code to GitHub main branch
- [ ] GitHub Actions workflow runs
- [ ] All CI jobs pass (Test, Build, Notify)
- [ ] Codecov report uploaded (if token configured)

**Expected behavior**: Green checkmarks on GitHub commits.

---

### 10. Build & Deploy
**What to test:**
```bash
# Development
npx expo start

# iOS Build
bunx eas-cli build --platform ios --profile development

# Android Build
bunx eas-cli build --platform android --profile development
```

**Expected behavior**: Builds complete without errors.

---

## 🐛 Known Limitations

1. **Web Limitations**:
   - SecureStore falls back to unencrypted AsyncStorage
   - Haptic feedback not available
   - Camera may have browser compatibility issues

2. **First-Time Setup**:
   - User must go through Language → ToS → Privacy flow
   - Can't skip any step

3. **Voice Readout**:
   - Language is English only (hardcoded)
   - Voice quality varies by device/OS
   - May not work offline (device-dependent)

---

## 🎯 Performance Testing

**What to test:**
- [ ] App startup time (should be <3 seconds)
- [ ] Scan analysis time (AI response time)
- [ ] Profile loading time
- [ ] Memory usage (check for leaks)
- [ ] Battery drain during extended scanning

**Tools:**
- Xcode Instruments (iOS)
- Android Profiler (Android)
- React DevTools

---

## ✅ Sign-Off Checklist

Before deploying to production:
- [ ] All manual tests passed
- [ ] All automated tests passed (`bun test`)
- [ ] No TypeScript errors (`bunx tsc --noEmit`)
- [ ] No lint errors (`bun run lint`)
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Tested on web browser
- [ ] Privacy consent works
- [ ] Voice readout works
- [ ] Profiles encrypted (native)
- [ ] CI/CD passing on GitHub
- [ ] README.md updated
- [ ] .env.example documented
- [ ] UPGRADE_SUMMARY.md reviewed

---

## 🚀 Ready to Ship?

If all checkboxes are ✅, AlphaGo is ready for:
1. Beta testing with users
2. App Store submission (iOS)
3. Google Play submission (Android)
4. Production deployment

---

*Testing Guide v1.0*
*Last Updated: 2025-11-29*
