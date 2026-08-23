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
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedChef, setSelectedChef] = useState(null);
  const [mealWindow, setMealWindow] = useState('LUNCH');

  // Reels State
  const [activeReelIndex, setActiveReelIndex] = useState(0);
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
      reviews: '142 reviews',
      fssai: 'FSSAI 21524089000142',
      bio: 'Authentic coastal homemaker from Malvan. Every masala is ground fresh on a traditional stone daily.',
      tagline: 'Fresh coastal spices ground daily by hand in Ghansoli.',
      dishName: 'Authentic Malvani Fish Thali',
      price: 179,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
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
      reviews: '98 reviews',
      fssai: 'FSSAI 21524089000198',
      bio: 'Pure vegetarian homemaker kitchen. Zero onion & garlic options available upon request.',
      tagline: 'Zero onion, zero garlic Jain options available.',
      dishName: 'Kathiyawadi Shuddh Thali',
      price: 149,
      photoUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      avatarEmoji: '🥻',
      menu: [
        { id: 'm3', name: 'Kathiyawadi Shuddh Thali', desc: 'Ringan Bharta, Sev Tamatar, 4 Phulka, Dal Fry, Jeera Rice', price: 149 },
        { id: 'm4', name: 'Jain Special Thali', desc: 'Paneer Makhani (No Onion/Garlic), 4 Phulka, Rice, Sweet', price: 159 },
      ],
    },
    {
      id: 'k3',
      kitchenName: 'Kolhapuri Flavors',
      chefName: 'Pradip Patil',
      rating: '4.9',
      reviews: '210 reviews',
      regionalIdentity: '🌶️ KOLHAPURI SPECIALIST',
      fssai: 'FSSAI 21524089000210',
      bio: 'Spicy and flavorful authentic Kolhapuri recipes handed down through generations.',
      tagline: 'Traditional Tambda & Pandhra Rassa cooked slow.',
      dishName: 'Kolhapuri Chicken Tiffin',
      price: 189,
      photoUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
      avatarEmoji: '👨‍🍳',
      menu: [
        { id: 'm5', name: 'Kolhapuri Chicken Tiffin', desc: 'Tambda Rassa, Pandhra Rassa, Chicken Sukka, 3 Bhakri', price: 189 },
      ],
    },
  ];

  const sampleReels = [
    {
      id: 'r1',
      chefName: 'Sunita Deshmukh',
      kitchenName: 'Surmai Konkan Kitchen',
      avatarEmoji: '👩‍🍳',
      caption: 'Hand-grinding fresh Malvani masala at 6 AM in Ghansoli! 🌶️🌊',
      sound: 'Original Sound — Sunita Deshmukh',
      likes: 1420,
      photoUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'r2',
      chefName: 'Meenakshi Joshi',
      kitchenName: 'Annapurna Shuddh Rasoi',
      avatarEmoji: '🥻',
      caption: 'Making soft, fluffy Phulkas for today\'s pure veg Gujarati tiffins! 🌱',
      sound: 'Gujarati Traditional Folk — Meenakshi',
      likes: 980,
      photoUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // PanResponder Gesture Engine for Hinge/Bumble Touch Swipe
  const pan = useRef(new Animated.ValueXY()).current;
  const currentKitchen = sampleKitchens[cardIndex % sampleKitchens.length];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 120) {
          // Swipe Right ➔ LIKE & ORDER
          Animated.timing(pan, { toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy }, duration: 200, useNativeDriver: false }).start(() => {
            addToCart(currentKitchen);
            pan.setValue({ x: 0, y: 0 });
            setCardIndex((prev) => (prev + 1) % sampleKitchens.length);
          });
        } else if (gestureState.dx < -120) {
          // Swipe Left ➔ NOPE / SKIP
          Animated.timing(pan, { toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy }, duration: 200, useNativeDriver: false }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setCardIndex((prev) => (prev + 1) % sampleKitchens.length);
          });
        } else {
          // Spring back to center
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

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const addToCart = (kitchen, item = null) => {
    const selectedItem = item || {
      id: kitchen.id,
      dishName: kitchen.dishName,
      price: kitchen.price,
      kitchenName: kitchen.kitchenName,
    };
    setCart([selectedItem]);
    Alert.alert('Added to Cart 🛒', `${selectedItem.dishName} added!`);
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    const item = cart[0];
    const payload = {
      items: [{ menu_item_id: item.id || 'm1', chef_id: '9876543210', quantity: 1 }],
      delivery_address: { flat_no: 'Flat 402', street_address: 'Sector 8, Ghansoli', phone: '7416767453' },
    };

    const res = await checkoutMobileOrder(payload);
    setActiveOrder(res);
    setCart([]);
    Alert.alert('Order Created! 🎉', `Order ID: ${res.order_id}\nRedirecting to live driver tracking...`);
  };

  const toggleLikeReel = (id) => {
    setLikedReels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { id: `c_${Date.now()}`, user: 'You', text: newComment.trim() }]);
    setNewComment('');
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

        {/* Location Cluster Chip */}
        <TouchableOpacity
          style={styles.clusterBadge}
          onPress={() => setCluster(cluster === 'Ghansoli' ? 'Vashi' : 'Ghansoli')}
        >
          <Text style={styles.clusterText}>📍 {cluster} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Tab Toggle */}
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
          <Text style={[styles.tabText, activeTab === 'REELS' && styles.tabTextActive]}>🎥 Homemaker Reels</Text>
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: HINGE / BUMBLE INTERACTIVE TOUCH-SWIPE CARDS */}
      {activeTab === 'KITCHENS' && (
        <View style={styles.content}>
          <View style={styles.hingeDeckWrapper}>
            
            {/* Interactive Animated Card */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.hingeCard,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate: cardRotation },
                  ],
                },
              ]}
            >
              {/* Swipe Right LIKE Stamp */}
              <Animated.View style={[styles.stampBox, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={styles.likeStampText}>❤️ LIKE / ORDER</Text>
              </Animated.View>

              {/* Swipe Left NOPE Stamp */}
              <Animated.View style={[styles.stampBox, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <Text style={styles.nopeStampText}>❌ NOPE / PASS</Text>
              </Animated.View>

              {/* Cover Image */}
              <Image source={{ uri: currentKitchen.photoUrl }} style={styles.cardImage} />

              {/* Header Badges */}
              <View style={styles.topBadgeRow}>
                <Text style={styles.regionBadge}>{currentKitchen.regionalIdentity}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {currentKitchen.rating}</Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.chefHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kitchenTitle}>{currentKitchen.kitchenName}</Text>
                    <Text style={styles.chefSubTitle}>By {currentKitchen.chefName}</Text>
                  </View>
                  <Text style={styles.avatarEmoji}>{currentKitchen.avatarEmoji}</Text>
                </View>

                <Text style={styles.taglineText}>{currentKitchen.tagline}</Text>

                {/* Dish Highlights */}
                <View style={styles.dishBox}>
                  <Text style={styles.dishLabel}>TODAY'S SPECIAL TIFFIN</Text>
                  <Text style={styles.dishTitle}>{currentKitchen.dishName}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.dishPrice}>₹{currentKitchen.price}<Text style={styles.perMeal}>/meal</Text></Text>
                    <Text style={styles.fssaiText}>✓ {currentKitchen.fssai}</Text>
                  </View>
                </View>

                {/* Action CTA Button */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => addToCart(currentKitchen)}
                >
                  <Text style={styles.ctaButtonText}>+ ADD TIFFIN TO CART (₹{currentKitchen.price})</Text>
                </TouchableOpacity>

                <Text style={styles.tapPrompt}>👉 Drag Left/Right to Swipe Cards or Tap to Expand ➔</Text>
              </View>

            </Animated.View>

          </View>
        </View>
      )}

      {/* SCREEN 2: INSTAGRAM / TIKTOK REELS FEED */}
      {activeTab === 'REELS' && (
        <ScrollView style={styles.content} pagingEnabled>
          {sampleReels.map((reel) => {
            const isLiked = likedReels[reel.id];
            return (
              <View key={reel.id} style={styles.reelContainer}>
                <Image source={{ uri: reel.photoUrl }} style={styles.reelFullImage} />

                {/* Right Action Icons Bar */}
                <View style={styles.reelActionsBar}>
                  <TouchableOpacity onPress={() => toggleLikeReel(reel.id)} style={styles.actionIconBtn}>
                    <Text style={styles.actionEmoji}>{isLiked ? '❤️' : '🤍'}</Text>
                    <Text style={styles.actionCount}>{reel.likes + (isLiked ? 1 : 0)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setCommentOpen(true)} style={styles.actionIconBtn}>
                    <Text style={styles.actionEmoji}>💬</Text>
                    <Text style={styles.actionCount}>{comments.length}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Alert.alert('Share Reel', 'Link copied to clipboard!')} style={styles.actionIconBtn}>
                    <Text style={styles.actionEmoji}>↪️</Text>
                    <Text style={styles.actionCount}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Caption Overlay */}
                <View style={styles.reelCaptionOverlay}>
                  <View style={styles.reelChefHeader}>
                    <Text style={styles.reelAvatar}>{reel.avatarEmoji}</Text>
                    <Text style={styles.reelChefName}>{reel.chefName}</Text>
                    <TouchableOpacity style={styles.followBtn}>
                      <Text style={styles.followText}>Follow</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reelCaption}>{reel.caption}</Text>
                  <Text style={styles.reelSound}>🎵 {reel.sound}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* SCREEN 3: CART & CHECKOUT */}
      {activeTab === 'CART' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionHeader}>Delivery Cart & Addresses</Text>
          {cart.length > 0 ? (
            <View style={styles.cartCard}>
              <Text style={styles.cartDishTitle}>{cart[0].dishName}</Text>
              <Text style={styles.cartKitchenName}>{cart[0].kitchenName}</Text>
              <View style={styles.divider} />
              
              <View style={styles.addressBox}>
                <Text style={styles.addressTag}>🏠 HOME ADDRESS</Text>
                <Text style={styles.addressText}>Flat 402, Sector 8, Ghansoli, Navi Mumbai</Text>
                <Text style={styles.addressPhone}>Receiver: +91 7416767453</Text>
              </View>

              <View style={styles.divider} />
              <View style={styles.priceLine}>
                <Text style={styles.priceLineLabel}>Tiffin Price:</Text>
                <Text style={styles.priceLineVal}>₹{cart[0].price}</Text>
              </View>
              <View style={styles.priceLine}>
                <Text style={styles.priceLineLabel}>Delivery Fee:</Text>
                <Text style={styles.priceLineVal}>₹30</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceLine}>
                <Text style={styles.totalPayLabel}>Total Amount:</Text>
                <Text style={styles.totalPayVal}>₹{cart[0].price + 30}</Text>
              </View>

              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutBtnText}>PROCEED TO PAY (₹{cart[0].price + 30})</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySub}>Explore homemaker tiffins to add items!</Text>
            </View>
          )}

          {activeOrder && (
            <View style={styles.trackingCard}>
              <Text style={styles.trackingStatus}>🟢 ORDER ACTIVE: {activeOrder.order_id}</Text>
              <Text style={styles.trackingSub}>Status: BATCHED & COOKING 🍱</Text>
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
            <Text style={styles.profilePhone}>+91 7416767453</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ VERIFIED MEMBER</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* SLIDE-UP COMMENT SHEET MODAL FOR REELS */}
      <Modal visible={commentOpen} animationType="slide" transparent onRequestClose={() => setCommentOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Community Comments ({comments.length})</Text>
              <TouchableOpacity onPress={() => setCommentOpen(false)}>
                <Text style={styles.closeSheet}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, paddingVertical: 10 }}>
              {comments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <Text style={styles.commentUser}>{c.user}:</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment for homemaker..."
                style={styles.commentInput}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.sendBtn}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('KITCHENS')}>
          <Text style={activeTab === 'KITCHENS' ? styles.tabBarActive : styles.tabBarInactive}>🍱 Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('REELS')}>
          <Text style={activeTab === 'REELS' ? styles.tabBarActive : styles.tabBarInactive}>🎥 Reels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('CART')}>
          <Text style={activeTab === 'CART' ? styles.tabBarActive : styles.tabBarInactive}>
            🛒 Cart {cart.length ? `(${cart.length})` : ''}
          </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE6DF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E1B18' },
  brandSubtitle: { fontSize: 11, color: '#7E766C', marginTop: 1 },
  clusterBadge: {
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFD4C2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clusterText: { fontSize: 12, fontWeight: 'bold', color: '#E53A00' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE6DF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: '#FFF5F0' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#7E766C' },
  tabTextActive: { color: '#E53A00', fontWeight: 'bold' },
  content: { flex: 1 },
  
  /* HINGE STACKED CARD & GESTURE STAMPS */
  hingeDeckWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  hingeCard: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EBE6DF',
    overflow: 'hidden',
    elevation: 6,
  },
  stampBox: {
    position: 'absolute',
    top: 40,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
  },
  likeStamp: { right: 20, borderColor: '#166534', backgroundColor: 'rgba(230, 244, 234, 0.9)' },
  likeStampText: { color: '#166534', fontWeight: 'extrabold', fontSize: 16 },
  nopeStamp: { left: 20, borderColor: '#991B1B', backgroundColor: 'rgba(254, 226, 226, 0.9)' },
  nopeStampText: { color: '#991B1B', fontWeight: 'extrabold', fontSize: 16 },

  cardImage: { width: '100%', height: 230, backgroundColor: '#EBE6DF' },
  topBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionBadge: {
    backgroundColor: 'rgba(30, 27, 24, 0.85)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },
  cardBody: { padding: 20 },
  chefHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kitchenTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18' },
  chefSubTitle: { fontSize: 13, color: '#7E766C', marginTop: 2 },
  avatarEmoji: { fontSize: 32 },
  taglineText: { fontSize: 13, color: '#4A443F', marginTop: 10, lineHeight: 18 },
  dishBox: {
    backgroundColor: '#FBF9F6',
    borderWidth: 1,
    borderColor: '#EBE6DF',
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
  },
  dishLabel: { fontSize: 9, fontWeight: 'bold', color: '#E53A00', letterSpacing: 0.8 },
  dishTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E1B18', marginTop: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  dishPrice: { fontSize: 18, fontWeight: 'bold', color: '#E53A00' },
  perMeal: { fontSize: 12, color: '#7E766C', fontWeight: 'normal' },
  fssaiText: { fontSize: 10, color: '#166534', fontWeight: 'bold' },
  
  ctaButton: {
    backgroundColor: '#E53A00',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  tapPrompt: { fontSize: 11, color: '#7E766C', textTransform: 'uppercase', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },

  /* INSTAGRAM / TIKTOK REELS FEED STYLES */
  reelContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 170, backgroundColor: '#000000', position: 'relative' },
  reelFullImage: { width: '100%', height: '100%', opacity: 0.9 },
  reelActionsBar: { position: 'absolute', right: 16, bottom: 90, alignItems: 'center', gap: 20 },
  actionIconBtn: { alignItems: 'center' },
  actionEmoji: { fontSize: 28 },
  actionCount: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  reelCaptionOverlay: { position: 'absolute', left: 16, bottom: 20, right: 80 },
  reelChefHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reelAvatar: { fontSize: 24 },
  reelChefName: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  followBtn: { backgroundColor: '#E53A00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  followText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  reelCaption: { color: '#FFFFFF', fontSize: 13, marginTop: 6, lineHeight: 18 },
  reelSound: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 6, fontWeight: 'bold' },

  /* COMMENT SHEET MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentSheet: { height: 380, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#EBE6DF', pb: 10 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18' },
  closeSheet: { fontSize: 18, fontWeight: 'bold', color: '#7E766C' },
  commentRow: { flexDirection: 'row', gap: 6, marginVertical: 6 },
  commentUser: { fontWeight: 'bold', fontSize: 12, color: '#E53A00' },
  commentText: { fontSize: 12, color: '#1E1B18', flex: 1 },
  commentInputRow: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#EBE6DF' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#EBE6DF', borderRadius: 14, px: 12, py: 8, fontSize: 12 },
  sendBtn: { backgroundColor: '#E53A00', paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center' },
  sendText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },

  /* CART & ACCOUNT STYLES */
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', margin: 16 },
  cartCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  cartDishTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1B18' },
  cartKitchenName: { fontSize: 13, color: '#7E766C', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EBE6DF', marginVertical: 14 },
  addressBox: { backgroundColor: '#FBF9F6', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EBE6DF' },
  addressTag: { fontSize: 10, fontWeight: 'bold', color: '#E53A00' },
  addressText: { fontSize: 13, fontWeight: 'bold', color: '#1E1B18', marginTop: 4 },
  addressPhone: { fontSize: 11, color: '#7E766C', marginTop: 2 },
  priceLine: { flexDirection: 'row', justify: 'space-between', marginBottom: 8 },
  priceLineLabel: { fontSize: 13, color: '#7E766C' },
  priceLineVal: { fontSize: 13, fontWeight: 'bold', color: '#1E1B18' },
  totalPayLabel: { fontSize: 15, fontWeight: 'bold', color: '#1E1B18' },
  totalPayVal: { fontSize: 20, fontWeight: 'bold', color: '#E53A00' },
  checkoutBtn: { backgroundColor: '#E53A00', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 16 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#7E766C', marginTop: 4 },
  trackingCard: { margin: 16, backgroundColor: '#E6F4EA', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#A8DADC' },
  trackingStatus: { fontSize: 13, fontWeight: 'bold', color: '#1E4620' },
  trackingSub: { fontSize: 12, color: '#2D6A4F', marginTop: 4 },
  accountProfileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF', margin: 16 },
  profileEmoji: { fontSize: 54 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', marginTop: 8 },
  profilePhone: { fontSize: 13, color: '#7E766C', marginTop: 2 },
  verifiedBadge: { marginTop: 12, backgroundColor: '#E6F4EA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  verifiedText: { fontSize: 11, fontWeight: 'bold', color: '#1E4620' },
  
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EBE6DF',
    paddingVertical: 14,
  },
  tabBarItem: { flex: 1, alignItems: 'center' },
  tabBarActive: { color: '#E53A00', fontWeight: 'bold', fontSize: 13 },
  tabBarInactive: { color: '#7E766C', fontSize: 13 },
});
