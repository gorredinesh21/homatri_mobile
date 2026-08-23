import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { fetchTiffinMenu, checkoutMobileOrder } from './src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [activeTab, setActiveTab] = useState('KITCHENS'); // KITCHENS, REELS, CART, ACCOUNT
  const [cluster, setCluster] = useState('Ghansoli');
  const [cardIndex, setCardIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  const sampleKitchens = [
    {
      id: 'k1',
      kitchenName: 'Surmai Konkan Kitchen',
      chefName: 'Sunita Deshmukh',
      regionalIdentity: '🌊 MALVANI & KONKANI SPECIALIST',
      rating: '4.9',
      reviews: '142 reviews',
      fssai: 'FSSAI 21524089000142',
      tagline: 'Fresh coastal spices ground daily by hand in Ghansoli.',
      dishName: 'Authentic Malvani Fish Thali',
      price: 179,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      avatarEmoji: '👩‍🍳',
    },
    {
      id: 'k2',
      kitchenName: 'Annapurna Shuddh Rasoi',
      chefName: 'Meenakshi Joshi',
      regionalIdentity: '🌱 100% PURE VEG GUJARATI',
      rating: '4.8',
      reviews: '98 reviews',
      fssai: 'FSSAI 21524089000198',
      tagline: 'Zero onion, zero garlic Jain options available.',
      dishName: 'Kathiyawadi Shuddh Thali',
      price: 149,
      photoUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      avatarEmoji: '🥻',
    },
    {
      id: 'k3',
      kitchenName: 'Kolhapuri Flavors',
      chefName: 'Pradip Patil',
      rating: '4.9',
      reviews: '210 reviews',
      regionalIdentity: '🌶️ KOLHAPURI SPECIALIST',
      fssai: 'FSSAI 21524089000210',
      tagline: 'Traditional Tambda & Pandhra Rassa cooked slow.',
      dishName: 'Kolhapuri Chicken Tiffin',
      price: 189,
      photoUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
      avatarEmoji: '👨‍🍳',
    },
  ];

  const currentKitchen = sampleKitchens[cardIndex % sampleKitchens.length];

  const handleNextCard = () => {
    setCardIndex((prev) => (prev + 1) % sampleKitchens.length);
  };

  const handlePrevCard = () => {
    setCardIndex((prev) => (prev - 1 + sampleKitchens.length) % sampleKitchens.length);
  };

  const addToCart = (kitchen) => {
    setCart([kitchen]);
    Alert.alert('Added to Cart 🛒', `${kitchen.dishName} from ${kitchen.kitchenName} added!`);
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    const item = cart[0];
    const payload = {
      items: [{ menu_item_id: item.id, chef_id: '9876543210', quantity: 1 }],
      delivery_address: { flat_no: 'Flat 402', street_address: 'Sector 8, Ghansoli', phone: '7416767453' },
    };

    const res = await checkoutMobileOrder(payload);
    setActiveOrder(res);
    setCart([]);
    Alert.alert('Order Created! 🎉', `Order ID: ${res.order_id}\nRedirecting to live driver tracking...`);
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

        {/* Cluster Location Chip */}
        <TouchableOpacity
          style={styles.clusterBadge}
          onPress={() => setCluster(cluster === 'Ghansoli' ? 'Vashi' : 'Ghansoli')}
        >
          <Text style={styles.clusterText}>📍 {cluster} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Tab Navigation (Kitchens | Community Reels) */}
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
          <Text style={[styles.tabText, activeTab === 'REELS' && styles.tabTextActive]}>🎥 Homemaker Stories</Text>
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: KITCHENS (HINGE-STYLE SWIPE CARDS) */}
      {activeTab === 'KITCHENS' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {/* HINGE STACKED CARD */}
          <View style={styles.hingeCardContainer}>
            <View style={styles.hingeCard}>
              
              {/* Cover Image */}
              <Image source={{ uri: currentKitchen.photoUrl }} style={styles.cardImage} />

              {/* Top Floating Badge */}
              <View style={styles.topBadgeRow}>
                <Text style={styles.regionBadge}>{currentKitchen.regionalIdentity}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {currentKitchen.rating}</Text>
                </View>
              </View>

              {/* Card Body Details */}
              <View style={styles.cardBody}>
                <View style={styles.chefHeader}>
                  <View>
                    <Text style={styles.kitchenTitle}>{currentKitchen.kitchenName}</Text>
                    <Text style={styles.chefSubTitle}>By {currentKitchen.chefName}</Text>
                  </div>
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

                {/* Large Action CTA Button */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => addToCart(currentKitchen)}
                >
                  <Text style={styles.ctaButtonText}>+ ADD TIFFIN TO CART (₹{currentKitchen.price})</Text>
                </TouchableOpacity>

              </View>
            </View>

            {/* Hinge Swipe Control Actions */}
            <View style={styles.swipeActions}>
              <TouchableOpacity style={styles.skipBtn} onPress={handlePrevCard}>
                <Text style={styles.skipBtnText}>‹ Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNextCard}>
                <Text style={styles.nextBtnText}>Next Kitchen ›</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      )}

      {/* SCREEN 2: COMMUNITY REELS */}
      {activeTab === 'REELS' && (
        <ScrollView style={styles.content}>
          <View style={styles.reelCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' }}
              style={styles.reelImage}
            />
            <View style={styles.reelOverlay}>
              <Text style={styles.reelChef}>👩‍🍳 Sunita Deshmukh</Text>
              <Text style={styles.reelTitle}>Hand-Grinding Fresh Malvani Spices in Ghansoli</Text>
              <Text style={styles.reelSub}>"Every masala is prepared fresh every morning at 6 AM."</Text>
            </View>
          </View>
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
              
              {/* Delivery Address Preview */}
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

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => setActiveTab('KITCHENS')}>
          <Text style={activeTab === 'KITCHENS' ? styles.tabBarActive : styles.tabBarInactive}>🍱 Explore</Text>
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
    justify: 'space-between',
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
  content: { flex: 1, padding: 16 },
  
  /* HINGE STACKED CARD STYLES */
  hingeCardContainer: { marginTop: 4, alignItems: 'center' },
  hingeCard: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EBE6DF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardImage: { width: '100%', height: 230, backgroundColor: '#EBE6DF' },
  topBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justify: 'space-between',
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
    overflow: 'hidden',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },
  cardBody: { padding: 20 },
  chefHeader: { flexDirection: 'row', justify: 'space-between', alignItems: 'flex-start' },
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
  priceRow: { flexDirection: 'row', justify: 'space-between', alignItems: 'center', marginTop: 8 },
  dishPrice: { fontSize: 18, fontWeight: 'bold', color: '#E53A00' },
  perMeal: { fontSize: 12, color: '#7E766C', fontWeight: 'normal' },
  fssaiText: { fontSize: 10, color: '#166534', fontWeight: 'bold' },
  
  /* LARGE ACCESSIBLE CTA BUTTON */
  ctaButton: {
    backgroundColor: '#E53A00',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#E53A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  
  swipeActions: { flexDirection: 'row', gap: 12, marginTop: 16, width: SCREEN_WIDTH - 32 },
  skipBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE6DF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  skipBtnText: { fontSize: 13, fontWeight: 'bold', color: '#7E766C' },
  nextBtn: {
    flex: 1,
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFD4C2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 13, fontWeight: 'bold', color: '#E53A00' },

  /* REELS CARD */
  reelCard: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#EBE6DF' },
  reelImage: { width: '100%', height: 360 },
  reelOverlay: { padding: 18 },
  reelChef: { fontSize: 12, fontWeight: 'bold', color: '#E53A00' },
  reelTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18', marginTop: 4 },
  reelSub: { fontSize: 12, color: '#7E766C', marginTop: 4 },

  /* CART & ACCOUNT CARDS */
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18', marginBottom: 16 },
  cartCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EBE6DF' },
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
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF' },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#7E766C', marginTop: 4 },
  trackingCard: { marginTop: 16, backgroundColor: '#E6F4EA', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#A8DADC' },
  trackingStatus: { fontSize: 13, fontWeight: 'bold', color: '#1E4620' },
  trackingSub: { fontSize: 12, color: '#2D6A4F', marginTop: 4 },
  accountProfileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF' },
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
