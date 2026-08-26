import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Modal,
  PanResponder,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import {
  fetchTiffinMenu,
  checkoutMobileOrder,
  registerMobileUser,
  loginMobileUser,
} from './src/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [activeTab, setActiveTab] = useState('KITCHENS'); // KITCHENS, REELS, CART, ACCOUNT
  const [cluster, setCluster] = useState('Ghansoli');
  const [cardIndex, setCardIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [mealWindowFilter, setMealWindowFilter] = useState('ALL');

  // User Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState('7416767453');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('SIGN_UP'); // "SIGN_UP" or "LOG_IN"
  const [authPhoneInput, setAuthPhoneInput] = useState('');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authNameInput, setAuthNameInput] = useState('');

  // Cart & Address State
  const [cart, setCart] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 'addr_1',
      addressType: 'HOME',
      fullAddress: 'Flat 402, Sector 8, Ghansoli, Navi Mumbai',
      phone: '7416767453',
    },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState('addr_1');

  // Bulk Catering Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [targetChefName, setTargetChefName] = useState(null);
  const [bulkGuestCount, setBulkGuestCount] = useState(25);

  // Order & Payment State
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentScreenOpen, setPaymentScreenOpen] = useState(false);

  // Reels & Comments State
  const [likedReels, setLikedReels] = useState({});

  const sampleKitchens = [
    {
      id: 'k1',
      kitchenName: 'Surmai Konkan Kitchen',
      chefName: 'Sunita Deshmukh',
      regionalIdentity: '🌊 MALVANI & KONKANI SPECIALIST',
      rating: '4.9',
      fssai: 'FSSAI 21524089000142',
      bio: 'Authentic coastal homemaker from Malvan. Every masala is ground fresh on a traditional stone daily.',
      tagline: 'Fresh coastal spices ground daily by hand in Ghansoli.',
      dishName: 'Authentic Malvani Fish Thali',
      price: 179,
      photos: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
      ],
      avatarEmoji: '👩‍🍳',
      menu: [
        { id: 'm1', name: 'Surmai Fry Fish Thali', desc: 'Surmai Fry, Sol Kadhi, 3 Chapati, Rice, Malvani Curry', price: 179 },
        { id: 'm2', name: 'Prawns Curry Tiffin', desc: 'Prawns Curry, 3 Chapati, Steamed Rice, Salad', price: 169 },
      ],
    },
    {
      id: 'k2',
      kitchenName: 'Annapurna Shuddh Rasoi',
      chefName: 'Meenakshi Joshi',
      regionalIdentity: '🌱 100% PURE VEG GUJARATI',
      rating: '4.8',
      fssai: 'FSSAI 21524089000198',
      bio: 'Pure vegetarian homemaker kitchen. Zero onion & garlic options available upon request.',
      tagline: 'Zero onion, zero garlic Jain options available.',
      dishName: 'Kathiyawadi Shuddh Thali',
      price: 149,
      photos: [
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      ],
      avatarEmoji: '🥻',
      menu: [
        { id: 'm3', name: 'Kathiyawadi Shuddh Thali', desc: 'Ringan Bharta, Sev Tamatar, 4 Phulka, Dal Fry, Jeera Rice', price: 149 },
      ],
    },
  ];

  const currentKitchen = sampleKitchens[cardIndex % sampleKitchens.length];

  // PanResponder Gesture Engine
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.timing(pan, { toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy }, duration: 200, useNativeDriver: false }).start(() => {
            Alert.alert('Saved to Favorites ❤️', `${currentKitchen.kitchenName} saved!`);
            pan.setValue({ x: 0, y: 0 });
            setPhotoIndex(0);
            setCardIndex((prev) => (prev + 1) % sampleKitchens.length);
          });
        } else if (gestureState.dx < -120) {
          Animated.timing(pan, { toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy }, duration: 200, useNativeDriver: false }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setPhotoIndex(0);
            setCardIndex((prev) => (prev + 1) % sampleKitchens.length);
          });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const cardRotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const handlePhotoTap = (evt) => {
    const x = evt.nativeEvent.locationX;
    if (x > SCREEN_WIDTH / 2) {
      setPhotoIndex((prev) => (prev + 1) % currentKitchen.photos.length);
    } else {
      setPhotoIndex((prev) => (prev - 1 + currentKitchen.photos.length) % currentKitchen.photos.length);
    }
  };

  const addToCart = (item) => {
    setCart([item]);
    Alert.alert('Added to Cart 🛒', `${item.name || item.dishName} added!`);
  };

  const openTargetedBulkModal = (chefName) => {
    setTargetChefName(chefName);
    setIsBulkModalOpen(true);
  };

  const handleSignUpSubmit = async () => {
    if (!authPhoneInput || !authEmailInput || !authPasswordInput) {
      Alert.alert('Error', 'Phone, Email, and Password are mandatory.');
      return;
    }
    try {
      await registerMobileUser({
        phone: authPhoneInput,
        email: authEmailInput,
        password: authPasswordInput,
        fullName: authNameInput,
      });
      setUserPhone(authPhoneInput);
      setUserEmail(authEmailInput);
      setUserName(authNameInput || 'Customer');
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      Alert.alert('Account Created! 🎉', 'You are now signed in to Homatri.');
    } catch (e) {
      Alert.alert('Sign Up Error', e.message || 'Registration failed.');
    }
  };

  const handleLogInSubmit = async () => {
    if (!authPhoneInput || !authPasswordInput) {
      Alert.alert('Error', 'Phone and Password are required.');
      return;
    }
    try {
      await loginMobileUser({ phone: authPhoneInput, password: authPasswordInput });
      setUserPhone(authPhoneInput);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      Alert.alert('Welcome Back! 👋', 'Signed in successfully.');
    } catch (e) {
      Alert.alert('Log In Error', e.message || 'Invalid credentials.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F6" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Homatri</Text>
          <Text style={styles.brandSubtitle}>Home-Cooked Meals in Navi Mumbai</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.clusterBadge}
            onPress={() => setCluster(cluster === 'Ghansoli' ? 'Vashi' : 'Ghansoli')}
          >
            <Text style={styles.clusterText}>📍 {cluster} ▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authHeaderBtn}
            onPress={() => setIsAuthModalOpen(true)}
          >
            <Text style={styles.authHeaderBtnText}>{isAuthenticated ? '👤 Profile' : '🔑 Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dual Tab Header */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'KITCHENS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('KITCHENS')}
        >
          <Text style={[styles.tabText, activeTab === 'KITCHENS' && styles.tabTextActive]}>🍱 Explore Kitchens</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'REELS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('REELS')}
        >
          <Text style={[styles.tabText, activeTab === 'REELS' && styles.tabTextActive]}>🎥 Community Reels</Text>
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: KITCHENS DISCOVERY */}
      {activeTab === 'KITCHENS' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.servingFilterBar}>
            {['ALL', 'LUNCH', 'DINNER'].map((win) => (
              <TouchableOpacity
                key={win}
                style={[styles.filterPill, mealWindowFilter === win && styles.filterPillActive]}
                onPress={() => setMealWindowFilter(win)}
              >
                <Text style={[styles.filterPillText, mealWindowFilter === win && styles.filterPillTextActive]}>
                  {win === 'ALL' ? 'All Window' : win === 'LUNCH' ? '☀️ Lunch' : '🌙 Dinner'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* HINGE / TINDER CARD DECK */}
          <View style={styles.hingeDeckWrapper}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.hingeCard,
                { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: cardRotation }] },
              ]}
            >
              <View style={styles.photoDotsRow}>
                {currentKitchen.photos.map((_, i) => (
                  <View key={i} style={[styles.photoDot, photoIndex === i && styles.photoDotActive]} />
                ))}
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={handlePhotoTap} style={{ position: 'relative' }}>
                <Image source={{ uri: currentKitchen.photos[photoIndex % currentKitchen.photos.length] }} style={styles.cardImage} />
                <View style={styles.topBadgeRow}>
                  <Text style={styles.regionBadge}>{currentKitchen.regionalIdentity}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {currentKitchen.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.cardBody}>
                <View style={styles.chefHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kitchenTitle}>{currentKitchen.kitchenName}</Text>
                    <Text style={styles.chefSubTitle}>By {currentKitchen.chefName}</Text>
                  </View>
                  <Text style={styles.avatarEmoji}>{currentKitchen.avatarEmoji}</Text>
                </View>

                <Text style={styles.bioText}>{currentKitchen.bio}</Text>

                {/* TARGETED CHEF BULK CATERING BUTTON INSIDE CHEF CARD */}
                <TouchableOpacity
                  style={styles.targetedChefBulkBtn}
                  onPress={() => openTargetedBulkModal(currentKitchen.chefName)}
                >
                  <Text style={styles.targetedChefBulkText}>📦 Request Bulk Catering from {currentKitchen.chefName} ➔</Text>
                </TouchableOpacity>

                {/* Menu Items List */}
                <Text style={styles.menuHeaderTitle}>Available Menu Items</Text>
                {currentKitchen.menu.map((item) => (
                  <View key={item.id} style={styles.dishListItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dishItemName}>{item.name}</Text>
                      <Text style={styles.dishItemDesc}>{item.desc}</Text>
                      <Text style={styles.dishItemPrice}>₹{item.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.addDishBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.addDishBtnText}>+ ADD</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

            </Animated.View>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 2: REELS FEED */}
      {activeTab === 'REELS' && (
        <ScrollView style={styles.content}>
          <View style={styles.reelContainer}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' }} style={styles.reelFullImage} />
            <View style={styles.reelCaptionOverlay}>
              <Text style={styles.reelChefName}>👩‍🍳 Sunita Deshmukh</Text>
              <Text style={styles.reelCaption}>Hand-grinding fresh Malvani masala at 6 AM in Ghansoli! 🌶️</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 3: CART */}
      {activeTab === 'CART' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionHeader}>Delivery Cart & Addresses</Text>
          {cart.length > 0 ? (
            <View style={styles.cartCard}>
              <Text style={styles.cartDishTitle}>{cart[0].name || cart[0].dishName}</Text>
              <View style={styles.divider} />
              <Text style={styles.addressHeaderLabel}>DELIVERY ADDRESS</Text>
              <Text style={styles.addressText}>{savedAddresses[0].fullAddress}</Text>
              <View style={styles.divider} />
              <View style={styles.priceLine}>
                <Text style={styles.priceLineLabel}>Total Payable:</Text>
                <Text style={styles.totalPayVal}>₹{cart[0].price + 30}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => setPaymentScreenOpen(true)}>
                <Text style={styles.checkoutBtnText}>PROCEED TO PAY (₹{cart[0].price + 30})</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* SCREEN 4: ACCOUNT */}
      {activeTab === 'ACCOUNT' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionHeader}>Customer Account</Text>
          <View style={styles.accountProfileCard}>
            <Text style={styles.profileEmoji}>🍱</Text>
            <Text style={styles.profileName}>{userName || 'Dinesh Chandan'}</Text>
            <Text style={{ fontSize: 13, color: '#7E766C', marginTop: 2 }}>+91 {userPhone}</Text>
            <Text style={styles.verifiedBadge}>✓ VERIFIED MEMBER</Text>
          </View>
        </ScrollView>
      )}

      {/* AUTH MODAL (SEPARATE SIGN_UP vs LOG_IN) */}
      <Modal visible={isAuthModalOpen} animationType="slide" transparent onRequestClose={() => setIsAuthModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentSheet}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sheetTitle}>{authMode === 'SIGN_UP' ? 'Create Your Account 🍱' : 'Welcome Back 👋'}</Text>
              <TouchableOpacity onPress={() => setIsAuthModalOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {authMode === 'SIGN_UP' ? (
              <View style={{ gap: 10 }}>
                <TextInput value={authPhoneInput} onChangeText={setAuthPhoneInput} placeholder="10-Digit Mobile Number *" keyboardType="phone-pad" style={styles.authInput} />
                <TextInput value={authEmailInput} onChangeText={setAuthEmailInput} placeholder="Email Address *" keyboardType="email-address" style={styles.authInput} />
                <TextInput value={authPasswordInput} onChangeText={setAuthPasswordInput} placeholder="Create Password *" secureTextEntry style={styles.authInput} />
                <TextInput value={authNameInput} onChangeText={setAuthNameInput} placeholder="Full Name (Optional)" style={styles.authInput} />

                <TouchableOpacity style={styles.checkoutBtn} onPress={handleSignUpSubmit}>
                  <Text style={styles.checkoutBtnText}>Create Account & Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAuthMode('LOG_IN')} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#E53A00', fontWeight: 'bold' }}>Already have an account? Log In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <TextInput value={authPhoneInput} onChangeText={setAuthPhoneInput} placeholder="10-Digit Mobile Number *" keyboardType="phone-pad" style={styles.authInput} />
                <TextInput value={authPasswordInput} onChangeText={setAuthPasswordInput} placeholder="Enter Password *" secureTextEntry style={styles.authInput} />

                <TouchableOpacity style={styles.checkoutBtn} onPress={handleLogInSubmit}>
                  <Text style={styles.checkoutBtnText}>Log In to Homatri</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAuthMode('SIGN_UP')} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#E53A00', fontWeight: 'bold' }}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* TARGETED CHEF BULK CATERING MODAL */}
      <Modal visible={isBulkModalOpen} animationType="slide" transparent onRequestClose={() => setIsBulkModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentSheet}>
            <Text style={styles.sheetTitle}>📦 Request Bulk Catering from {targetChefName}</Text>
            <Text style={{ fontSize: 13, color: '#7E766C' }}>Number of Guests: {bulkGuestCount} People</Text>
            
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              {[10, 25, 50, 100, 250].map((n) => (
                <TouchableOpacity key={n} onPress={() => setBulkGuestCount(n)} style={[styles.countChip, bulkGuestCount === n && styles.countChipActive]}>
                  <Text style={[styles.countChipText, bulkGuestCount === n && styles.countChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E53A00' }}>Total Estimated Quote: ₹{bulkGuestCount * 149}</Text>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => { setIsBulkModalOpen(false); Alert.alert('Bulk Quote Request Sent!', `Request sent specifically to ${targetChefName}.`); }}>
              <Text style={styles.checkoutBtnText}>Submit Catering Request (₹{bulkGuestCount * 149})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CLEAN 4-TAB BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('KITCHENS')}>
          <Text style={activeTab === 'KITCHENS' ? styles.tabBarActive : styles.tabBarInactive}>🍱 Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('REELS')}>
          <Text style={activeTab === 'REELS' ? styles.tabBarActive : styles.tabBarInactive}>🎥 Reels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('CART')}>
          <Text style={activeTab === 'CART' ? styles.tabBarActive : styles.tabBarInactive}>🛒 Cart ({cart.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('ACCOUNT')}>
          <Text style={activeTab === 'ACCOUNT' ? styles.tabBarActive : styles.tabBarInactive}>👤 Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9F6' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EBE6DF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E1B18' },
  brandSubtitle: { fontSize: 11, color: '#7E766C', marginTop: 1 },
  clusterBadge: { backgroundColor: '#FFF5F0', borderWidth: 1, borderColor: '#FFD4C2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  clusterText: { fontSize: 11, fontWeight: 'bold', color: '#E53A00' },
  authHeaderBtn: { backgroundColor: '#1E1B18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  authHeaderBtnText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EBE6DF', paddingHorizontal: 12, paddingVertical: 6 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: '#FFF5F0' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#7E766C' },
  tabTextActive: { color: '#E53A00', fontWeight: 'bold' },
  content: { flex: 1 },

  servingFilterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 16, backgroundColor: '#FFFFFF' },
  filterPillActive: { backgroundColor: '#E53A00', borderColor: '#E53A00' },
  filterPillText: { fontSize: 11, fontWeight: 'bold', color: '#7E766C' },
  filterPillTextActive: { color: '#FFFFFF' },

  hingeDeckWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  hingeCard: { width: SCREEN_WIDTH - 32, backgroundColor: '#FFFFFF', borderRadius: 28, borderWidth: 1, borderColor: '#EBE6DF', overflow: 'hidden', elevation: 6 },
  photoDotsRow: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 50, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  photoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  photoDotActive: { backgroundColor: '#FFFFFF', width: 16 },
  cardImage: { width: '100%', height: 230, backgroundColor: '#EBE6DF' },
  topBadgeRow: { position: 'absolute', top: 20, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regionBadge: { backgroundColor: 'rgba(30, 27, 24, 0.85)', color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingBadge: { backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },
  cardBody: { padding: 20 },
  chefHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kitchenTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18' },
  chefSubTitle: { fontSize: 13, color: '#7E766C', marginTop: 2 },
  avatarEmoji: { fontSize: 32 },
  bioText: { fontSize: 13, color: '#4A443F', marginTop: 8, lineHeight: 18 },
  
  targetedChefBulkBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#1E1B18', borderRadius: 14, alignItems: 'center' },
  targetedChefBulkText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },

  menuHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E1B18', marginTop: 16 },
  dishListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FBF9F6', borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 16, marginTop: 8 },
  dishItemName: { fontSize: 14, fontWeight: 'bold', color: '#1E1B18' },
  dishItemDesc: { fontSize: 11, color: '#7E766C', marginTop: 2 },
  dishItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#E53A00', marginTop: 4 },
  addDishBtn: { backgroundColor: '#E53A00', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addDishBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },

  reelContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 170, backgroundColor: '#000000', position: 'relative' },
  reelFullImage: { width: '100%', height: '100%', opacity: 0.9 },
  reelCaptionOverlay: { position: 'absolute', left: 16, bottom: 20, right: 80 },
  reelChefName: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  reelCaption: { color: '#FFFFFF', fontSize: 13, marginTop: 6, lineHeight: 18 },

  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', margin: 16 },
  cartCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  cartDishTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1B18' },
  divider: { height: 1, backgroundColor: '#EBE6DF', marginVertical: 14 },
  addressHeaderLabel: { fontSize: 11, fontWeight: 'bold', color: '#7E766C' },
  addressText: { fontSize: 13, fontWeight: 'bold', color: '#1E1B18', marginTop: 4 },
  priceLine: { flexDirection: 'row', justify: 'space-between', marginBottom: 8 },
  priceLineLabel: { fontSize: 13, color: '#7E766C' },
  totalPayVal: { fontSize: 20, fontWeight: 'bold', color: '#E53A00' },
  checkoutBtn: { backgroundColor: '#E53A00', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 16 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18', marginTop: 12 },
  accountProfileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  profileEmoji: { fontSize: 54 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', marginTop: 8 },
  verifiedBadge: { marginTop: 12, backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#1E4620', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E1B18', marginBottom: 12 },
  authInput: { borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, backgroundColor: '#FBF9F6' },
  countChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 12 },
  countChipActive: { backgroundColor: '#E53A00', borderColor: '#E53A00' },
  countChipText: { fontSize: 12, fontWeight: 'bold', color: '#7E766C' },
  countChipTextActive: { color: '#FFFFFF' },

  bottomTabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EBE6DF', paddingVertical: 14 },
  tabBarItem: { flex: 1, alignItems: 'center' },
  tabBarActive: { color: '#E53A00', fontWeight: 'bold', fontSize: 13 },
  tabBarInactive: { color: '#7E766C', fontSize: 13 },
});
