import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { fetchTiffinMenu, checkoutMobileOrder } from './src/services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('EXPLORE'); // EXPLORE, CART, ACCOUNT
  const [cluster, setCluster] = useState('Ghansoli');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchTiffinMenu(cluster);
      setMenuItems(data);
    })();
  }, [cluster]);

  const addToCart = (item) => {
    setCart([item]);
    Alert.alert("Added to Cart", `${item.dish_name} added to your tiffin cart!`);
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    const item = cart[0];
    const payload = {
      items: [{ menu_item_id: item.id, chef_id: "9876543210", quantity: 1 }],
      delivery_address: { flat_no: "Flat 402", street_address: "Sector 8, Ghansoli", phone: "7416767453" },
    };

    const res = await checkoutMobileOrder(payload);
    setActiveOrder(res);
    setCart([]);
    Alert.alert("Order Placed Successfully! 🎉", `Order ID: ${res.order_id}\nTracking delivery status live!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F6" />

      {/* Top Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Homatri Tiffins</Text>
          <Text style={styles.brandSubtitle}>Home-Cooked Meals in Navi Mumbai</Text>
        </View>
        <TouchableOpacity style={styles.clusterBadge} onPress={() => setCluster(cluster === 'Ghansoli' ? 'Vashi' : 'Ghansoli')}>
          <Text style={styles.clusterText}>📍 {cluster}</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN SCREEN CONTENT */}
      {activeTab === 'EXPLORE' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.sectionTitle}>Daily Homemaker Tiffins</Text>
          
          {menuItems.map((item) => (
            <View key={item.id} style={styles.tiffinCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>{item.badge}</Text>
                <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              </View>

              <Text style={styles.dishTitle}>{item.dish_name}</Text>
              <Text style={styles.kitchenSub}>By {item.kitchen_name} ({item.chef_name})</Text>
              <Text style={styles.descText}>{item.items_description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.priceText}>₹{item.price}<Text style={styles.perMeal}>/meal</Text></Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                  <Text style={styles.addBtnText}>+ Add Tiffin</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'CART' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Your Tiffin Cart</Text>
          {cart.length > 0 ? (
            <View style={styles.cartBox}>
              <Text style={styles.cartDish}>{cart[0].dish_name}</Text>
              <Text style={styles.cartSub}>{cart[0].kitchen_name}</Text>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Item Total:</Text>
                <Text style={styles.priceVal}>₹{cart[0].price}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee:</Text>
                <Text style={styles.priceVal}>₹30</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Payable:</Text>
                <Text style={styles.totalVal}>₹{cart[0].price + 30}</Text>
              </View>

              <TouchableOpacity style={styles.payBtn} onPress={handleCheckout}>
                <Text style={styles.payBtnText}>Proceed to Checkout (₹{cart[0].price + 30})</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Your cart is empty!</Text>
            </View>
          )}

          {activeOrder && (
            <View style={styles.orderBox}>
              <Text style={styles.activeTitle}>🟢 Active Order: {activeOrder.order_id}</Text>
              <Text style={styles.activeSub}>Status: BATCHED & COOKING 🍱</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'ACCOUNT' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>My Homatri Account</Text>
          <View style={styles.profileCard}>
            <Text style={styles.avatarEmoji}>🍱</Text>
            <Text style={styles.userName}>Dinesh Chandan</Text>
            <Text style={styles.userPhone}>+91 7416767453</Text>
            <Text style={styles.userBadge}>VERIFIED MEMBER</Text>
          </View>
        </ScrollView>
      )}

      {/* BOTTOM TAB NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('EXPLORE')}>
          <Text style={activeTab === 'EXPLORE' ? styles.navActive : styles.navInactive}>🍱 Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('CART')}>
          <Text style={activeTab === 'CART' ? styles.navActive : styles.navInactive}>
            🛒 Cart {cart.length ? `(${cart.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('ACCOUNT')}>
          <Text style={activeTab === 'ACCOUNT' ? styles.navActive : styles.navInactive}>👤 Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9F6' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EBE6DF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B18' },
  brandSubtitle: { fontSize: 11, color: '#7E766C' },
  clusterBadge: { backgroundColor: '#FFF5F0', borderWidth: 1, borderColor: '#FFD4C2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  clusterText: { fontSize: 12, fontWeight: 'bold', color: '#E53A00' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1B18', marginBottom: 16 },
  tiffinCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EBE6DF' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badgeText: { backgroundColor: '#E53A00', color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#1E1B18' },
  dishTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18' },
  kitchenSub: { fontSize: 12, color: '#7E766C', marginTop: 2 },
  descText: { fontSize: 12, color: '#4A443F', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: '#F2ECE4' },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#E53A00' },
  perMeal: { fontSize: 12, color: '#7E766C', fontWeight: 'normal' },
  addBtn: { backgroundColor: '#E53A00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  cartBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EBE6DF' },
  cartDish: { fontSize: 16, fontWeight: 'bold', color: '#1E1B18' },
  cartSub: { fontSize: 12, color: '#7E766C', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EBE6DF', marginVertical: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { fontSize: 13, color: '#7E766C' },
  priceVal: { fontSize: 13, fontWeight: 'bold', color: '#1E1B18' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1E1B18' },
  totalVal: { fontSize: 18, fontWeight: 'bold', color: '#E53A00' },
  payBtn: { backgroundColor: '#E53A00', padding: 14, borderRadius: 14, marginTop: 16, alignItems: 'center' },
  payBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#7E766C', fontSize: 14, fontWeight: 'bold' },
  orderBox: { marginTop: 20, backgroundColor: '#E6F4EA', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#A8DADC' },
  activeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E4620' },
  activeSub: { fontSize: 12, color: '#2D6A4F', marginTop: 4 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#EBE6DF' },
  avatarEmoji: { fontSize: 48, marginBottom: 8 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1E1B18' },
  userPhone: { fontSize: 13, color: '#7E766C', marginTop: 2 },
  userBadge: { marginTop: 10, backgroundColor: '#E6F4EA', color: '#1E4620', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EBE6DF', paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center' },
  navActive: { color: '#E53A00', fontWeight: 'bold', fontSize: 13 },
  navInactive: { color: '#7E766C', fontSize: 13 },
});
