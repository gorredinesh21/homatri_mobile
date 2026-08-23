import React, { useState, useRef } from 'react';
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
import { fetchTiffinMenu, checkoutMobileOrder } from './src/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [activeTab, setActiveTab] = useState('KITCHENS'); // KITCHENS, REELS, CART, ACCOUNT
  const [cluster, setCluster] = useState('Ghansoli');
  const [cardIndex, setCardIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [mealWindowFilter, setMealWindowFilter] = useState('ALL');

  // User Profile State
  const [userPhone, setUserPhone] = useState('7416767453');
  const [isPhoneSaved, setIsPhoneSaved] = useState(false);

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
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newFlatNo, setNewFlatNo] = useState('');
  const [newStreet, setNewStreet] = useState('');

  // Bulk Catering Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkGuestCount, setBulkGuestCount] = useState(25);

  // Order & Payment State
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentScreenOpen, setPaymentScreenOpen] = useState(false);

  // Reels & Comments State
  const [likedReels, setLikedReels] = useState({});
  const [commentOpen, setCommentOpen] = useState(false);
  const [comments, setComments] = useState([
    { id: 'c1', user: 'Priya S.', text: 'The Malvani curry masala smells amazing! Ordering today.' },
    { id: 'c2', user: 'Rahul M.', text: 'Is this 100% pure veg?' },
  ]);
  const [newComment, setNewComment] = useState('');

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

  const processPayment = async () => {
    const payload = {
      items: [{ menu_item_id: cart[0]?.id || 'm1', chef_id: '9876543210', quantity: 1 }],
      delivery_address: { flat_no: 'Flat 402', street_address: 'Sector 8, Ghansoli', phone: userPhone },
    };
    const res = await checkoutMobileOrder(payload);
    setActiveOrder(res);
    setCart([]);
    setPaymentScreenOpen(false);
    setActiveTab('CART');
    Alert.alert('Order Confirmed! 🎉', `Order ID: ${res.order_id}\nTracking delivery live!`);
  };

  const handleAddAddress = () => {
    if (!newFlatNo.trim() || !newStreet.trim()) return;
    const newAddr = {
      id: `addr_${Date.now()}`,
      addressType: 'HOME',
      fullAddress: `${newFlatNo.trim()}, ${newStreet.trim()}, ${cluster}`,
      phone: userPhone,
    };
    setSavedAddresses([newAddr, ...savedAddresses]);
    setSelectedAddressId(newAddr.id);
    setNewFlatNo('');
    setNewStreet('');
    setIsAddressModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F6" />

      {/* Header Bar matching Website */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Homatri</Text>
          <Text style={styles.brandSubtitle}>Home-Cooked Meals in Navi Mumbai</Text>
        </View>
        <TouchableOpacity
          style={styles.clusterBadge}
          onPress={() => setCluster(cluster === 'Ghansoli' ? 'Vashi' : 'Ghansoli')}
        >
          <Text style={styles.clusterText}>📍 {cluster} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Tab Header matching Website */}
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
          
          {/* Serving Window Filter Bar matching Website */}
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

          {/* Prominent Bulk Catering Banner Button matching Website */}
          <TouchableOpacity style={styles.bulkBannerBtn} onPress={() => setIsBulkModalOpen(true)}>
            <Text style={styles.bulkBannerText}>📦 Request Bulk Catering for Events (10–500 Guests) ➔</Text>
          </TouchableOpacity>

          {/* HINGE / TINDER CARD DECK */}
          <View style={styles.hingeDeckWrapper}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.hingeCard,
                { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: cardRotation }] },
              ]}
            >
              {/* Photo Dots Bar */}
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

                {/* Reels Jump Link */}
                <TouchableOpacity style={styles.reelsJumpBtn} onPress={() => setActiveTab('REELS')}>
                  <Text style={styles.reelsJumpText}>🎥 Watch {currentKitchen.chefName}'s Kitchen Reels ➔</Text>
                </TouchableOpacity>

                {/* Dish Menu Items List */}
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

          {activeOrder && (
            <View style={styles.trackingCard}>
              <Text style={styles.trackingStatus}>🟢 ORDER ACTIVE: {activeOrder.order_id}</Text>
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
            <Text style={styles.profileName}>Dinesh Chandan</Text>
            <Text style={styles.verifiedBadge}>✓ VERIFIED MEMBER</Text>
          </View>
        </ScrollView>
      )}

      {/* BULK CATERING MODAL */}
      <Modal visible={isBulkModalOpen} animationType="slide" transparent onRequestClose={() => setIsBulkModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentSheet}>
            <Text style={styles.sheetTitle}>📦 Event Bulk Catering Quote Calculator</Text>
            <Text style={{ fontSize: 13, color: '#7E766C' }}>Number of Guests: {bulkGuestCount} People</Text>
            
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              {[10, 25, 50, 100, 250].map((n) => (
                <TouchableOpacity key={n} onPress={() => setBulkGuestCount(n)} style={[styles.countChip, bulkGuestCount === n && styles.countChipActive]}>
                  <Text style={[styles.countChipText, bulkGuestCount === n && styles.countChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E53A00' }}>Total Estimated Quote: ₹{bulkGuestCount * 149}</Text>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => { setIsBulkModalOpen(false); Alert.alert('Quote Request Sent!', 'Our team will call you shortly.'); }}>
              <Text style={styles.checkoutBtnText}>Submit Catering Request (₹{bulkGuestCount * 149})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal visible={paymentScreenOpen} animationType="slide" onRequestClose={() => setPaymentScreenOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF9F6', padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }}>Secure Checkout</Text>
          <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: '#166534', marginTop: 30 }]} onPress={processPayment}>
            <Text style={styles.checkoutBtnText}>✅ MOCK PAY (SIMULATE SUCCESS)</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* CLEAN 4-TAB BOTTOM NAVIGATION BAR MATCHING WEBSITE */}
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
  clusterBadge: { backgroundColor: '#FFF5F0', borderWidth: 1, borderColor: '#FFD4C2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  clusterText: { fontSize: 12, fontWeight: 'bold', color: '#E53A00' },
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

  bulkBannerBtn: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: '#1E1B18', borderRadius: 16, alignItems: 'center' },
  bulkBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

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
  reelsJumpBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFF5F0', borderRadius: 12, borderColor: '#FFD4C2', borderWidth: 1 },
  reelsJumpText: { fontSize: 12, fontWeight: 'bold', color: '#E53A00' },
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
  trackingCard: { margin: 16, backgroundColor: '#E6F4EA', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#A8DADC' },
  trackingStatus: { fontSize: 13, fontWeight: 'bold', color: '#1E4620' },
  accountProfileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  profileEmoji: { fontSize: 54 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', marginTop: 8 },
  verifiedBadge: { marginTop: 12, backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#1E4620', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18', marginBottom: 12 },
  countChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 12 },
  countChipActive: { backgroundColor: '#E53A00', borderColor: '#E53A00' },
  countChipText: { fontSize: 12, fontWeight: 'bold', color: '#7E766C' },
  countChipTextActive: { color: '#FFFFFF' },

  bottomTabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EBE6DF', paddingVertical: 14 },
  tabBarItem: { flex: 1, alignItems: 'center' },
  tabBarActive: { color: '#E53A00', fontWeight: 'bold', fontSize: 13 },
  tabBarInactive: { color: '#7E766C', fontSize: 13 },
});
