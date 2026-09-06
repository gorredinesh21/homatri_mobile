import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useFonts } from 'expo-font';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkoutMobileOrder,
  registerMobileUser,
  loginMobileUser,
  canMessageUser,
  fetchKitchens,
  fetchSavedAddresses,
  verifyOrderPayment,
  likeReel,
  fetchBulkTemplates,
  submitBulkCheckout,
} from './src/services/api';
import { colors, fonts, formatINR } from './src/theme';
import { absoluteMediaUrl } from './src/config';
import { resolveCheckoutMealWindow } from './src/utils/mealWindow';
import { clusterCoords } from './src/utils/geo';
import { ALL_REGIONS, cuisinesForRegion, cuisineRequestUrl } from './src/utils/cuisineTree';
import UsernameSetupModal from './src/components/UsernameSetupModal';
import ReelsFeed from './src/components/ReelsFeed';
import CommentSheet from './src/components/CommentSheet';
import UserDirectChatScreen from './src/components/UserDirectChatScreen';
import ExpandedHingeProfile from './src/components/ExpandedHingeProfile';
import AddressBookModal from './src/components/AddressBookModal';
import PaymentSheetModal from './src/components/PaymentSheetModal';
import CartBubble from './src/components/CartBubble';
import OrdersScreen from './src/components/OrdersScreen';
import OrderTrackingScreen from './src/components/OrderTrackingScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DELIVERY_FEE = 11; // convenience fee
const STORAGE_KEYS = {
  auth: '@homatri/auth',
  cart: '@homatri/cart',
  cluster: '@homatri/cluster',
  address: '@homatri/selectedAddressId',
};

function mapKitchenCard(k) {
  const lunch = k.lunchMenu || [];
  const dinner = k.dinnerMenu || [];
  const menu = [...lunch, ...dinner].map((item) => ({
    id: item.menuItemId || item.menu_item_id,
    menuItemId: item.menuItemId || item.menu_item_id,
    chefId: k.chefId || k.chef_phone,
    mealWindow: item.mealWindow || item.meal_type,
    name: item.itemName || item.dish_name,
    desc: item.description || "",
    price: Number(item.price ?? item.unit_price ?? 0),
    dietaryTag: item.dietaryTag || item.dietary_tag || "",
    isAvailable: item.is_available !== false && item.availability !== "SOLD_OUT",
  }));
  const photo = absoluteMediaUrl(k.photoUrl || k.profileImageUrl);
  // Dish cards show FOOD photos only — chef faces stay on the kitchen profile.
  // "Meet ..." reels are chef portraits, so they are skipped here.
  const chefPhotoRaw = k.photoUrl || k.profileImageUrl || "";
  const foodPhotos = (k.reels || [])
    .filter((r) => !/^meet\b/i.test(String(r.caption || r.title || "")))
    .map((r) => absoluteMediaUrl(r.thumbnailUrl || r.videoUrl))
    .filter((url) => /\.(jpe?g|png|webp)(\?|$)/i.test(String(url || "")) && url !== absoluteMediaUrl(chefPhotoRaw));
  return {
    id: k.chefId || k.chef_phone,
    kitchenName: k.kitchenName,
    chefName: k.chefName,
    regionalIdentity: k.regionalIdentity || k.hometownRegion || "",
    regionValue: k.regionalIdentity || k.hometownRegion || "",
    rating: String(k.rating ?? ""),
    ratingNumber: Number(k.rating ?? 0),
    isServing: Boolean(k.isCurrentlyServing),
    isVerified: Boolean(k.isVerified),
    fssai: k.fssaiLicenseNumber ? `FSSAI ${k.fssaiLicenseNumber}` : "",
    bio: k.bio || "",
    photos: photo ? [photo] : [],
    foodPhotos: [...new Set(foodPhotos)],
    chefPhone: k.chef_phone || k.chefId,
    videoGallery: (k.reels || []).map((r) => ({
      reel_id: r.reelId,
      title: r.caption,
      caption: r.caption,
      thumbnail_url: absoluteMediaUrl(r.thumbnailUrl || r.videoUrl),
      video_url: absoluteMediaUrl(r.videoUrl),
    })),
    avatarEmoji: "👩‍🍳",
    menu,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('KITCHENS'); // KITCHENS, REELS, ORDERS, ACCOUNT (+ cart card modal)
  const [cartCardOpen, setCartCardOpen] = useState(false);
  const [cluster, setCluster] = useState('Ghansoli');
  const [mealWindowFilter, setMealWindowFilter] = useState('LUNCH'); // LUNCH | DINNER | TIFFIN
  const [region, setRegion] = useState('Maharashtra'); // launch region, pinned by default
  const [cuisine, setCuisine] = useState(null); // null = all cuisines in region
  const [profileKitchenId, setProfileKitchenId] = useState(null);

  // User Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('SIGN_UP'); // "SIGN_UP" or "LOG_IN"
  const [authPhoneInput, setAuthPhoneInput] = useState('');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authNameInput, setAuthNameInput] = useState('');

  // Cart & Address State
  const [cart, setCart] = useState([]);
  const [userToken, setUserToken] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // "COD" | "RAZORPAY"

  // Bulk Catering Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [targetChefName, setTargetChefName] = useState(null);
  const [bulkGuestCount, setBulkGuestCount] = useState(25);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Order & Payment State
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentScreenOpen, setPaymentScreenOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Reels & Comments State
  const [likedReels, setLikedReels] = useState({});
  const [commentReel, setCommentReel] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [focusReelId, setFocusReelId] = useState(null);

  const [liveKitchens, setLiveKitchens] = useState([]);

  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Fraunces_700Bold,
  });

  // ---- Persistence ----
  useEffect(() => {
    (async () => {
      try {
        const [authRaw, cartRaw, clusterRaw, addressRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.auth),
          AsyncStorage.getItem(STORAGE_KEYS.cart),
          AsyncStorage.getItem(STORAGE_KEYS.cluster),
          AsyncStorage.getItem(STORAGE_KEYS.address),
        ]);
        if (clusterRaw) setCluster(clusterRaw);
        if (cartRaw) setCart(JSON.parse(cartRaw));
        if (addressRaw) setSelectedAddressId(addressRaw);
        if (authRaw) {
          const auth = JSON.parse(authRaw);
          if (auth?.token) {
            setUserToken(auth.token);
            setUserPhone(auth.phone || '');
            setUserEmail(auth.email || '');
            setUserName(auth.name || '');
            setUsername(auth.username || '');
            setIsAuthenticated(true);
            loadAddresses(auth.token).catch(() => {});
          }
        }
      } catch {
        // Corrupt storage — start fresh.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)).catch(() => {});
  }, [cart]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.cluster, cluster).catch(() => {});
  }, [cluster]);

  useEffect(() => {
    if (selectedAddressId) {
      AsyncStorage.setItem(STORAGE_KEYS.address, selectedAddressId).catch(() => {});
    }
  }, [selectedAddressId]);

  const persistAuth = async ({ token, phone, email, name, username: uname }) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.auth,
      JSON.stringify({ token, phone, email, name, username: uname })
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.auth, STORAGE_KEYS.cart, STORAGE_KEYS.address]);
    setUserToken(null);
    setUserPhone('');
    setUserEmail('');
    setUserName('');
    setUsername('');
    setIsAuthenticated(false);
    setCart([]);
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setActiveOrder(null);
    setPaymentScreenOpen(false);
    setTrackedOrder(null);
    setActiveTab('KITCHENS');
    Alert.alert('Logged out', 'See you at the next meal! 👋');
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchKitchens(cluster);
        const list = Array.isArray(rows) ? rows : [];
        if (!cancelled) setLiveKitchens(list.map(mapKitchenCard));
      } catch {
        if (!cancelled) setLiveKitchens([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cluster]);

  const mealWindowFilterMatches = (item) => {
    if (mealWindowFilter === "TIFFIN") return true;
    if (mealWindowFilter === "ALL") return true;
    const w = String(item.mealWindow || "").toUpperCase();
    return w === mealWindowFilter || w === "BOTH";
  };

  // ---- Region → cuisine discovery (mirrors the website) ----
  const regionCuisines = cuisinesForRegion(region);
  const liveValuesInRegion = useMemo(
    () => new Set(regionCuisines.flatMap((entry) => entry.liveValues)),
    [regionCuisines]
  );
  const liveRegionValues = useMemo(
    () => [...new Set(liveKitchens.map((k) => k.regionValue).filter(Boolean))],
    [liveKitchens]
  );
  const selectedCuisine = cuisine ? regionCuisines.find((entry) => entry.label === cuisine) : null;
  const regionHasLive = liveRegionValues.some((value) => liveValuesInRegion.has(value));

  // Flat dish list for the home screen — food photos only, never chef faces.
  const homeDishes = useMemo(() => {
    const out = [];
    for (const kitchen of liveKitchens) {
      if (!liveValuesInRegion.has(kitchen.regionValue)) continue;
      if (selectedCuisine && !selectedCuisine.liveValues.includes(kitchen.regionValue)) continue;
      let photoIndex = 0;
      for (const item of kitchen.menu) {
        if (!item.isAvailable) continue;
        if (!mealWindowFilterMatches(item)) continue;
        out.push({
          ...item,
          desc: item.desc || "",
          kitchenName: kitchen.kitchenName,
          kitchenId: kitchen.id,
          kitchenRating: kitchen.ratingNumber,
          kitchenRegion: kitchen.regionalIdentity,
          isServing: kitchen.isServing,
          photo: kitchen.foodPhotos.length
            ? kitchen.foodPhotos[photoIndex++ % kitchen.foodPhotos.length]
            : null,
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKitchens, liveValuesInRegion, selectedCuisine, mealWindowFilter]);

  const profileKitchen = liveKitchens.find((k) => k.id === profileKitchenId) || null;
  const openKitchenProfile = (kitchenId) => {
    setProfileKitchenId(kitchenId);
    setProfileOpen(true);
  };

  // ---- Multi-item cart ----
  const cartSubtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const cartTotal = cartSubtotal + (cart.length ? DELIVERY_FEE : 0);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const addToCart = (item) => {
    if (!item?.menuItemId) {
      Alert.alert("Menu", "This dish is missing a live menu id.");
      return;
    }
    setCart((prev) => {
      const otherKitchen = prev.find((line) => line.chefId && line.chefId !== item.chefId);
      if (otherKitchen) {
        Alert.alert(
          "One kitchen per order",
          `Your cart already has dishes from ${otherKitchen.kitchenName || "another kitchen"}. Clear the cart to order from this kitchen.`
        );
        return prev;
      }
      const existing = prev.find((line) => line.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.menuItemId ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [...prev, { ...item, qty: 1, kitchenName: item.kitchenName || '' }];
    });
  };

  const changeQty = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((line) => (line.menuItemId === menuItemId ? { ...line, qty: line.qty + delta } : line))
        .filter((line) => line.qty > 0)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  };

  const loadAddresses = async (token) => {
    const rows = await fetchSavedAddresses(token);
    const list = Array.isArray(rows) ? rows : [];
    setSavedAddresses(list);
    setSelectedAddressId((prev) => (prev && list.some((a) => a.id === prev) ? prev : list[0]?.id || null));
  };

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || null;
  const scheduledMealWindow = useMemo(
    () => resolveCheckoutMealWindow(cart),
    [cart]
  );

  // ---- Checkout with payment ----
  const placeOrder = async () => {
    if (!isAuthenticated || !userToken) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!cart.length) return;
    if (!selectedAddress) {
      Alert.alert("Address", "Select a delivery address before checkout.");
      setAddressBookOpen(true);
      return;
    }
    try {
      const fallbackPin = clusterCoords(selectedAddress.cluster || cluster);
      const result = await checkoutMobileOrder(
        {
          meal_window: scheduledMealWindow.mealWindow,
          items: cart.map((line) => ({
            menu_item_id: line.menuItemId,
            chef_id: line.chefId,
            quantity: line.qty,
          })),
          delivery_address: {
            full_address: selectedAddress.full_address || selectedAddress.fullAddress,
            latitude: selectedAddress.latitude ?? fallbackPin.latitude,
            longitude: selectedAddress.longitude ?? fallbackPin.longitude,
            phone: selectedAddress.phone,
          },
          payment_method: paymentMethod,
        },
        userToken
      );
      setActiveOrder(result);
      setCart([]);
      if (result.payment_method === "RAZORPAY" && result.order_status === "PENDING_PAYMENT") {
        setPaymentScreenOpen(true);
      } else {
        Alert.alert("Order confirmed 🎉", `Order ${result.order_id} is in the kitchen queue.`);
        setTrackedOrder(result);
        setActiveTab('ORDERS');
      }
    } catch (e) {
      Alert.alert("Checkout", e.message);
    }
  };

  const completeTokenPayment = async () => {
    if (!activeOrder?.order_id || !userToken) return;
    try {
      const verified = await verifyOrderPayment(activeOrder.order_id, userToken);
      setActiveOrder(verified);
      setPaymentScreenOpen(false);
      Alert.alert("Payment successful 🎉", `Order ${verified.order_id ?? activeOrder.order_id} confirmed.`);
      setTrackedOrder(verified);
      setActiveTab('ORDERS');
    } catch (e) {
      Alert.alert("Payment", e.message);
    }
  };

  // ---- Bulk catering ----
  const submitBulkRequest = async () => {
    if (!isAuthenticated || !userToken || !userPhone) {
      setIsBulkModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    if (bulkGuestCount < 10) {
      Alert.alert("Bulk catering", "Minimum 10 guests.");
      return;
    }
    setBulkSubmitting(true);
    try {
      const templates = await fetchBulkTemplates();
      const template = Array.isArray(templates) && templates[0];
      if (!template) {
        Alert.alert("Bulk catering", "No catering templates are live right now. Try again later.");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const result = await submitBulkCheckout(
        {
          customer_phone: userPhone,
          event_date: today,
          event_time: "19:00",
          guest_count: bulkGuestCount,
          template_id: template.template_id,
        },
        userToken
      );
      setIsBulkModalOpen(false);
      Alert.alert(
        "Catering Request Sent! 📦",
        result?.message || `Your ${bulkGuestCount}-guest request (${template.template_name}) was sent.`
      );
    } catch (e) {
      Alert.alert("Bulk catering", e.message || "Could not submit request.");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openTargetedBulkModal = (chefName) => {
    setTargetChefName(chefName);
    setIsBulkModalOpen(true);
  };

  const openReelFromGallery = (video) => {
    setProfileOpen(false);
    setFocusReelId(video.reel_id);
    setActiveTab('REELS');
  };

  const openChatWithCommenter = async (comment) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (comment.user_phone === userPhone) return;
    const gate = await canMessageUser(comment.user_phone);
    if (!gate.allowed) {
      Alert.alert('Chef privacy', gate.detail);
      return;
    }
    setChatPeer({ phone: comment.user_phone, username: comment.username });
    setChatOpen(true);
  };

  const handleToggleLike = (reelId) => {
    setLikedReels((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
    if (userToken) {
      likeReel(reelId, userToken).catch(() => {});
    }
  };

  const handleSignUpSubmit = async () => {
    if (!authPhoneInput || !authEmailInput || !authPasswordInput) {
      Alert.alert('Error', 'Phone, Email, and Password are mandatory.');
      return;
    }
    try {
      const result = await registerMobileUser({
        phone: authPhoneInput,
        email: authEmailInput,
        password: authPasswordInput,
        fullName: authNameInput,
      });
      setUserPhone(authPhoneInput);
      setUserEmail(authEmailInput);
      setUserName(authNameInput || 'Customer');
      setUserToken(result.access_token);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setShowUsernameSetup(true);
      await persistAuth({ token: result.access_token, phone: authPhoneInput, email: authEmailInput, name: authNameInput || 'Customer', username: '' });
      if (result.access_token) await loadAddresses(result.access_token);
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
      const result = await loginMobileUser({ phone: authPhoneInput, password: authPasswordInput });
      setUserPhone(authPhoneInput);
      setUserName(result?.user?.full_name || '');
      setUsername(result?.user?.username || '');
      setUserToken(result.access_token);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      await persistAuth({
        token: result.access_token,
        phone: authPhoneInput,
        email: result?.user?.email || '',
        name: result?.user?.full_name || '',
        username: result?.user?.username || '',
      });
      if (result.access_token) await loadAddresses(result.access_token);
      if (!result?.user?.username) {
        setShowUsernameSetup(true);
      } else {
        Alert.alert('Welcome Back! 👋', 'Signed in successfully.');
      }
    } catch (e) {
      Alert.alert('Log In Error', e.message || 'Invalid credentials.');
    }
  };

  const onUsernameComplete = useCallback((saved) => {
    setUsername(saved);
    setShowUsernameSetup(false);
    (async () => {
      try {
        const authRaw = await AsyncStorage.getItem(STORAGE_KEYS.auth);
        const auth = authRaw ? JSON.parse(authRaw) : {};
        await AsyncStorage.setItem(
          STORAGE_KEYS.auth,
          JSON.stringify({ ...auth, username: saved })
        );
      } catch {
        // Non-fatal.
      }
    })();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Homatri</Text>
          <Text style={styles.brandSubtitle}>Achha Khao. Ghar Ka Khao.</Text>
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
            <Text style={styles.authHeaderBtnText}>{isAuthenticated ? '👤' : '🔑'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCREEN 1: WHAT'S COOKING — dish discovery (mirrors website landing) */}
      {activeTab === 'KITCHENS' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.homeHeadingWrap}>
            <Text style={styles.homeHeading}>WHAT&apos;S COOKING NEAR YOU TODAY?</Text>
            <Text style={styles.homeSubheading}>Home kitchens nearby serving fresh, just like ghar.</Text>
          </View>

          {/* Meal window tabs */}
          <View style={styles.mealTabsRow}>
            {[
              { id: 'LUNCH', label: '☀️ Lunch' },
              { id: 'DINNER', label: '🌙 Dinner' },
              { id: 'TIFFIN', label: '🍱 Tiffin Plans' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.mealTab, mealWindowFilter === tab.id && styles.mealTabActive]}
                onPress={() => setMealWindowFilter(tab.id)}
              >
                <Text style={[styles.mealTabText, mealWindowFilter === tab.id && styles.mealTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mealWindowFilter === 'TIFFIN' ? (
            <View style={{ marginTop: 14, gap: 12 }}>
              {[
                { emoji: '📅', title: 'Monthly Tiffin Plans', body: 'Daily lunch or dinner thalis all month. One kitchen, one fixed time, zero re-ordering.' },
                { emoji: '🏢', title: 'Office & Team Lunches', body: 'Bulk home-cooked lunches delivered together — pooled delivery keeps it cheap and hot.' },
                { emoji: '🎉', title: 'Events & Small Parties', body: 'Regional home cooks catering your function with real ghar-ka-khana.' },
              ].map((plan) => (
                <TouchableOpacity
                  key={plan.title}
                  style={styles.tiffinPlanCard}
                  activeOpacity={0.9}
                  onPress={() => openTargetedBulkModal(null)}
                >
                  <Text style={{ fontSize: 26 }}>{plan.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tiffinPlanTitle}>{plan.title}</Text>
                    <Text style={styles.tiffinPlanBody}>{plan.body}</Text>
                  </View>
                  <Text style={{ color: colors.orange, fontWeight: 'bold' }}>➔</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <>
              {/* Region chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionRow}>
                {ALL_REGIONS.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.regionChip, region === name && styles.regionChipActive]}
                    onPress={() => {
                      setRegion(name);
                      setCuisine(null);
                    }}
                  >
                    <Text style={[styles.regionChipText, region === name && styles.regionChipTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Cuisine chips within the region */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionRow}>
                <TouchableOpacity
                  style={[styles.cuisineChip, cuisine === null && styles.cuisineChipActive]}
                  onPress={() => setCuisine(null)}
                >
                  <Text style={[styles.cuisineChipText, cuisine === null && styles.cuisineChipTextActive]}>All</Text>
                </TouchableOpacity>
                {regionCuisines.map((entry) => {
                  const live = entry.liveValues.some((value) => liveRegionValues.includes(value));
                  const selected = cuisine === entry.label;
                  return (
                    <TouchableOpacity
                      key={entry.label}
                      style={[
                        styles.cuisineChip,
                        selected && styles.cuisineChipActive,
                        !live && !selected && styles.cuisineChipSoon,
                      ]}
                      onPress={() => setCuisine(selected ? null : entry.label)}
                    >
                      <Text style={[styles.cuisineChipText, selected && styles.cuisineChipTextActive]}>
                        {entry.label}
                        {live ? '  ●' : '  soon'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {(selectedCuisine && selectedCuisine.liveValues.length === 0) || (!regionHasLive && !selectedCuisine) ? (
                <View style={styles.comingSoonCard}>
                  <Text style={{ fontSize: 30 }}>🍽️</Text>
                  <Text style={styles.comingSoonTitle}>
                    {selectedCuisine ? `${selectedCuisine.label} kitchens` : `${region} kitchens`} are coming soon.
                  </Text>
                  <Text style={styles.comingSoonBody}>
                    We&apos;re onboarding cooks right now — the most requested regions get cooks first.
                  </Text>
                  <TouchableOpacity
                    style={styles.requestBtn}
                    onPress={() => Linking.openURL(cuisineRequestUrl(selectedCuisine ? selectedCuisine.label : `${region} food`))}
                  >
                    <Text style={styles.requestBtnText}>
                      Request {selectedCuisine ? selectedCuisine.label : `${region} food`} ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : homeDishes.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingTop: 14 }}>
                  {homeDishes.map((dish) => {
                    const inCart = cart.find((line) => line.menuItemId === dish.menuItemId);
                    const isNonVeg = /NON/i.test(String(dish.dietryTag || dish.dietaryTag || ''));
                    return (
                      <TouchableOpacity
                        key={`${dish.kitchenId}-${dish.menuItemId}`}
                        style={{ width: 148, alignItems: 'center' }}
                        activeOpacity={0.9}
                        onPress={() => openKitchenProfile(dish.kitchenId)}
                      >
                        <View style={{ position: 'relative' }}>
                          <View style={styles.circleRing}>
                            {dish.photo ? (
                              <Image source={{ uri: dish.photo }} style={styles.circleImg} />
                            ) : (
                              <Text style={{ fontSize: 26 }}>🍽️</Text>
                            )}
                          </View>
                          {dish.isServing ? <View style={styles.circleLiveDot} /> : null}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 2 }}>
                          <Text numberOfLines={2} style={styles.dishName}>{dish.name}</Text>
                          <View style={[styles.vegDotBox, isNonVeg && styles.vegDotBoxNon]}>
                            <View style={[styles.vegDot, isNonVeg && styles.vegDotNon]} />
                          </View>
                        </View>
                        {dish.desc ? (
                          <Text numberOfLines={2} style={styles.dishIncludes}>{dish.desc}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <Text style={styles.dishPrice}>{formatINR(dish.price)}</Text>
                          {inCart ? (
                            <View style={styles.qtyStepper}>
                              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(dish.menuItemId, -1)}>
                                <Text style={styles.qtyBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.qtyVal}>{inCart.qty}</Text>
                              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(dish.menuItemId, 1)}>
                                <Text style={styles.qtyBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(dish)}>
                              <Text style={styles.addBtnText}>+ Add</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Nothing live in this window right now.</Text>
                  <Text style={styles.emptyTitle}>Kitchens refresh daily — lunch opens in the morning, dinner after 3 PM.</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* SCREEN 2: REELS FEED */}
      {activeTab === 'REELS' && (
        <ReelsFeed
          likedReels={likedReels}
          initialReelId={focusReelId}
          onToggleLike={handleToggleLike}
          onOpenComments={(reel) => {
            if (!isAuthenticated) {
              setIsAuthModalOpen(true);
              return;
            }
            setCommentReel(reel);
          }}
        />
      )}

      {/* CART CARD - collapsible card from the floating bubble (web parity) */}
      <Modal visible={cartCardOpen} animationType="fade" transparent onRequestClose={() => setCartCardOpen(false)}>
        <View style={styles.cartCardOverlay}>
          <View style={styles.cartCardShell}>
            <View style={styles.cartCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartCardTitle}>Your order</Text>
                {cart[0] ? <Text style={styles.cartCardSub} numberOfLines={1}>{cart[0].kitchenName || ''}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setCartCardOpen(false)} style={styles.cartCardClose}>
                <Text style={{ color: colors.muted, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }}>
          {cart.length > 0 ? (
            <>
              {cart.map((line) => (
                <View key={line.menuItemId} style={styles.cartCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartDishTitle}>{line.name || line.dishName}</Text>
                      <Text style={styles.cartDishMeta}>{formatINR(line.price)} each{line.kitchenName ? ` · ${line.kitchenName}` : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(line.menuItemId)}>
                      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold' }}>✕ REMOVE</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.priceLine, { marginTop: 10, justifyContent: 'space-between' }]}>
                    <View style={styles.qtyStepper}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(line.menuItemId, -1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{line.qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(line.menuItemId, 1)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartLineTotal}>{formatINR(line.price * line.qty)}</Text>
                  </View>
                </View>
              ))}

              {/* Bill breakdown */}
              <View style={styles.cartCard}>
                <Text style={styles.addressHeaderLabel}>BILL DETAILS</Text>
                <View style={styles.divider} />
                <View style={styles.priceLine}>
                  <Text style={styles.priceLineLabel}>Item Total</Text>
                  <Text style={styles.priceLineValue}>{formatINR(cartSubtotal)}</Text>
                </View>
                <View style={styles.priceLine}>
                  <Text style={styles.priceLineLabel}>Convenience Fee</Text>
                  <Text style={styles.priceLineValue}>{formatINR(DELIVERY_FEE)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.priceLine}>
                  <Text style={styles.priceLineLabelBold}>To Pay</Text>
                  <Text style={styles.totalPayVal}>{formatINR(cartTotal)}</Text>
                </View>
              </View>

              {/* Delivery address */}
              <View style={styles.cartCard}>
                <Text style={styles.addressHeaderLabel}>DELIVER TO</Text>
                <Text style={styles.addressText}>
                  {selectedAddress
                    ? selectedAddress.full_address || selectedAddress.fullAddress
                    : "No address selected. Add one to enable checkout."}
                </Text>
                <Text style={styles.schedulingNote}>🍽️ Ordering for: {scheduledMealWindow.label}</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAddressBookOpen(true)}>
                  <Text style={styles.secondaryBtnText}>{selectedAddress ? 'Change Address' : 'Select Address'}</Text>
                </TouchableOpacity>
              </View>

              {/* Payment method */}
              <View style={styles.cartCard}>
                <Text style={styles.addressHeaderLabel}>PAYMENT METHOD</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]}
                    onPress={() => setPaymentMethod('COD')}
                  >
                    <Text style={styles.payOptionEmoji}>💵</Text>
                    <Text style={[styles.payOptionTitle, paymentMethod === 'COD' && { color: colors.orange }]}>Cash on Delivery</Text>
                    <Text style={styles.payOptionSub}>Pay {formatINR(cartTotal)} when it arrives</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payOption, paymentMethod === 'RAZORPAY' && styles.payOptionActive]}
                    onPress={() => setPaymentMethod('RAZORPAY')}
                  >
                    <Text style={styles.payOptionEmoji}>🔒</Text>
                    <Text style={[styles.payOptionTitle, paymentMethod === 'RAZORPAY' && { color: colors.orange }]}>Pay Online</Text>
                    <Text style={styles.payOptionSub}>Razorpay · {formatINR(1)} test token now</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.checkoutBtn} onPress={() => { placeOrder(); }}>
                <Text style={styles.checkoutBtnText}>
                  {paymentMethod === 'COD' ? 'PLACE ORDER' : 'PAY & CONFIRM'} ({formatINR(cartTotal)})
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
            </View>
          )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SCREEN 4: ORDERS */}
      {activeTab === 'ORDERS' && (
        isAuthenticated && userToken ? (
          <OrdersScreen token={userToken} onOpenOrder={setTrackedOrder} />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Sign in to see your orders</Text>
            <TouchableOpacity style={[styles.checkoutBtn, { alignSelf: 'stretch' }]} onPress={() => setIsAuthModalOpen(true)}>
              <Text style={styles.checkoutBtnText}>🔑 Sign In</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* SCREEN 5: ACCOUNT */}
      {activeTab === 'ACCOUNT' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
          <Text style={styles.sectionHeader}>Customer Account</Text>
          <View style={styles.accountProfileCard}>
            <Text style={styles.profileEmoji}>🍱</Text>
            <Text style={styles.profileName}>{userName || (isAuthenticated ? 'Homatri member' : 'Sign in')}</Text>
            {isAuthenticated ? <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>+91 {userPhone}</Text> : null}
            {username ? <Text style={{ fontSize: 13, color: colors.orange, fontWeight: 'bold', marginTop: 4 }}>@{username}</Text> : null}
            {isAuthenticated ? <Text style={styles.verifiedBadge}>✓ VERIFIED MEMBER</Text> : null}
            <TouchableOpacity style={[styles.checkoutBtn, { alignSelf: 'stretch' }]} onPress={() => { setChatPeer(null); setChatOpen(true); }}>
              <Text style={styles.checkoutBtnText}>Community Chat with Foodies</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { alignSelf: 'stretch', marginTop: 10 }]} onPress={() => setAddressBookOpen(true)}>
              <Text style={styles.secondaryBtnText}>📍 Manage Addresses</Text>
            </TouchableOpacity>
            {isAuthenticated ? (
              <TouchableOpacity style={[styles.logoutBtn, { alignSelf: 'stretch' }]} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            ) : null}
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
                  <Text style={{ fontSize: 12, color: colors.orange, fontWeight: 'bold' }}>Already have an account? Log In</Text>
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
                  <Text style={{ fontSize: 12, color: colors.orange, fontWeight: 'bold' }}>Don't have an account? Sign Up</Text>
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
            <Text style={styles.sheetTitle}>
              {targetChefName ? `📦 Request Bulk Catering from ${targetChefName}` : '📦 Tiffin & Bulk Plans'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>Number of Guests: {bulkGuestCount} People</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              {[10, 25, 50, 100, 250].map((n) => (
                <TouchableOpacity key={n} onPress={() => setBulkGuestCount(n)} style={[styles.countChip, bulkGuestCount === n && styles.countChipActive]}>
                  <Text style={[styles.countChipText, bulkGuestCount === n && styles.countChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.orange }}>Total Estimated Quote: {formatINR(bulkGuestCount * 149)}</Text>

            <TouchableOpacity style={styles.checkoutBtn} onPress={submitBulkRequest} disabled={bulkSubmitting}>
              <Text style={styles.checkoutBtnText}>{bulkSubmitting ? 'Submitting…' : `Submit Catering Request (${formatINR(bulkGuestCount * 149)})`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <UsernameSetupModal
        visible={showUsernameSetup}
        phone={userPhone}
        fullName={userName}
        onComplete={onUsernameComplete}
      />
      <CommentSheet
        visible={Boolean(commentReel)}
        reel={commentReel}
        userPhone={userPhone}
        username={username || userName}
        onClose={() => setCommentReel(null)}
        onMessageUser={openChatWithCommenter}
      />
      <UserDirectChatScreen
        visible={chatOpen}
        userPhone={userPhone}
        initialPeer={chatPeer}
        onClose={() => { setChatOpen(false); setChatPeer(null); }}
      />
      <ExpandedHingeProfile
        visible={profileOpen}
        kitchen={profileKitchen}
        onClose={() => setProfileOpen(false)}
        onAdd={addToCart}
        onOpenReel={openReelFromGallery}
        onBulk={(name) => { setProfileOpen(false); openTargetedBulkModal(name); }}
      />
      <AddressBookModal
        visible={addressBookOpen}
        addresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        onSelect={setSelectedAddressId}
        onRefresh={() => loadAddresses(userToken)}
        token={userToken}
        onClose={() => setAddressBookOpen(false)}
      />
      <PaymentSheetModal
        visible={paymentScreenOpen}
        order={activeOrder}
        orderTotal={activeOrder?.total_amount}
        onPay={completeTokenPayment}
        onClose={() => setPaymentScreenOpen(false)}
      />
      <OrderTrackingScreen
        visible={Boolean(trackedOrder)}
        order={trackedOrder}
        token={userToken}
        onClose={() => setTrackedOrder(null)}
      />

      {/* FLOATING DRAGGABLE CART BUBBLE - tap to open the cart */}
      <CartBubble
        count={cartCount}
        totalRupees={cartTotal}
        onPress={() => setCartCardOpen(true)}
      />

      {/* CLEAN 5-TAB BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        {[
          { id: 'KITCHENS', icon: '🍱', label: 'Explore' },
          { id: 'REELS', icon: '🎥', label: 'Reels' },
          { id: 'ORDERS', icon: '📦', label: 'Orders' },
          { id: 'ACCOUNT', icon: '👤', label: 'Account' },
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <TouchableOpacity key={item.id} style={styles.tabBarItem} onPress={() => setActiveTab(item.id)}>
              <Text style={[styles.tabBarIcon, active && styles.tabBarIconActive]}>{item.icon}</Text>
              <Text style={[styles.tabBarLabel, active ? styles.tabBarActive : styles.tabBarInactive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: colors.orange, fontFamily: fonts.heading },
  brandSubtitle: { fontSize: 11, color: colors.muted, marginTop: 1, fontFamily: fonts.base },
  clusterBadge: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.orangeLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  clusterText: { fontSize: 11, fontWeight: 'bold', color: colors.orange, fontFamily: fonts.baseBold },
  authHeaderBtn: { backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  authHeaderBtnText: { fontSize: 11, fontWeight: 'bold', color: colors.white, fontFamily: fonts.baseBold },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: colors.orangeLight },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.muted, fontFamily: fonts.baseSemiBold },
  tabTextActive: { color: colors.orange, fontWeight: 'bold', fontFamily: fonts.baseBold },
  content: { flex: 1 },

  servingFilterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  filterPillText: { fontSize: 11, fontWeight: 'bold', color: colors.muted, fontFamily: fonts.baseBold },
  filterPillTextActive: { color: colors.white },

  hingeDeckWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  hingeCard: { width: SCREEN_WIDTH - 32, backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', elevation: 6 },
  photoDotsRow: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 50, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  photoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  photoDotActive: { backgroundColor: colors.white, width: 16 },
  cardImage: { width: '100%', height: 230, backgroundColor: colors.border },
  topBadgeRow: { position: 'absolute', top: 20, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regionBadge: { backgroundColor: 'rgba(30, 41, 59, 0.85)', color: colors.white, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingBadge: { backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#B45309', fontFamily: fonts.baseBold },
  cardBody: { padding: 20 },
  chefHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kitchenTitle: { fontSize: 20, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.heading },
  chefSubTitle: { fontSize: 13, color: colors.muted, marginTop: 2, fontFamily: fonts.base },
  avatarEmoji: { fontSize: 32 },
  bioText: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 18, fontFamily: fonts.base },

  targetedChefBulkBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.dark, borderRadius: 14, alignItems: 'center' },
  targetedChefBulkText: { fontSize: 11, fontWeight: 'bold', color: colors.white, fontFamily: fonts.baseBold },

  menuHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: colors.dark, marginTop: 16, fontFamily: fonts.heading },
  dishListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginTop: 8 },
  dishItemName: { fontSize: 14, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  dishItemDesc: { fontSize: 11, color: colors.muted, marginTop: 2, fontFamily: fonts.base },
  dishItemPrice: { fontSize: 15, fontWeight: 'bold', color: colors.orange, marginTop: 4, fontFamily: fonts.baseBold },
  addDishBtn: { backgroundColor: colors.orange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addDishBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 11, fontFamily: fonts.baseBold },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.orange, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: colors.orange, fontSize: 16, fontWeight: 'bold', fontFamily: fonts.baseBold },
  qtyVal: { minWidth: 18, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },

  reelContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 170, backgroundColor: '#000000', position: 'relative' },
  reelFullImage: { width: '100%', height: '100%', opacity: 0.9 },
  reelCaptionOverlay: { position: 'absolute', left: 16, bottom: 20, right: 80 },
  reelChefName: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  reelCaption: { color: colors.white, fontSize: 13, marginTop: 6, lineHeight: 18 },

  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: colors.dark, margin: 16, fontFamily: fonts.heading },
  cartCard: { backgroundColor: colors.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 },
  cartDishTitle: { fontSize: 18, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  cartDishMeta: { fontSize: 12, color: colors.muted, marginTop: 4, fontFamily: fonts.base },
  cartLineTotal: { fontSize: 16, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  addressHeaderLabel: { fontSize: 11, fontWeight: 'bold', color: colors.muted, fontFamily: fonts.baseBold },
  addressText: { fontSize: 13, fontWeight: 'bold', color: colors.dark, marginTop: 6, fontFamily: fonts.baseBold },
  schedulingNote: { fontSize: 11, fontWeight: 'bold', color: colors.orange, marginTop: 6, fontFamily: fonts.baseBold },
  priceLine: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  priceLineLabel: { flex: 1, fontSize: 13, color: colors.muted, fontFamily: fonts.base },
  priceLineLabelBold: { flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  priceLineValue: { fontSize: 13, color: colors.dark, fontFamily: fonts.baseMedium },
  totalPayVal: { fontSize: 20, fontWeight: 'bold', color: colors.orange, fontFamily: fonts.baseBold },
  secondaryBtn: { marginTop: 12, borderWidth: 1.5, borderColor: colors.orange, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: colors.orange, fontWeight: 'bold', fontSize: 12, fontFamily: fonts.baseBold },
  payOption: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14, alignItems: 'center', backgroundColor: colors.cream },
  payOptionActive: { borderColor: colors.orange, backgroundColor: colors.orangeLight },
  payOptionEmoji: { fontSize: 22 },
  payOptionTitle: { fontSize: 13, fontWeight: 'bold', color: colors.dark, marginTop: 6, fontFamily: fonts.baseBold },
  payOptionSub: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center', fontFamily: fonts.base },
  checkoutBtn: { backgroundColor: colors.orange, paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 16, marginHorizontal: 16 },
  checkoutBtnText: { color: colors.white, fontSize: 14, fontWeight: 'bold', fontFamily: fonts.baseBold },
  emptyCard: { backgroundColor: colors.white, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border, margin: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.dark, marginTop: 12, fontFamily: fonts.baseBold },
  accountProfileCard: { backgroundColor: colors.white, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border, margin: 16 },
  profileEmoji: { fontSize: 54 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: colors.dark, marginTop: 8, fontFamily: fonts.heading },
  verifiedBadge: { marginTop: 12, backgroundColor: colors.greenLight, color: colors.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 11, fontWeight: 'bold', overflow: 'hidden', fontFamily: fonts.baseBold },
  logoutBtn: { marginTop: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  logoutBtnText: { color: colors.muted, fontWeight: 'bold', fontSize: 12, fontFamily: fonts.baseBold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 15, fontWeight: 'bold', color: colors.dark, marginBottom: 12, fontFamily: fonts.baseBold },
  authInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, backgroundColor: colors.cream, fontFamily: fonts.base },
  countChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  countChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  countChipText: { fontSize: 12, fontWeight: 'bold', color: colors.muted, fontFamily: fonts.baseBold },
  countChipTextActive: { color: colors.white },

  bottomTabBar: {
    flexDirection: 'row', backgroundColor: colors.white, paddingVertical: 12, paddingHorizontal: 8,
    marginBottom: 12, marginHorizontal: 10, borderRadius: 26,
    borderTopWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  tabBarItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  tabBarIcon: { fontSize: 26 },
  tabBarIconActive: { transform: [{ translateY: -1 }] },
  tabBarLabel: { fontSize: 12 },
  tabBarActive: { color: colors.orange, fontWeight: 'bold', fontFamily: fonts.baseBold },
  tabBarInactive: { color: colors.muted, fontFamily: fonts.base },

  // ---- WHAT'S COOKING home (reference design) ----
  homeHeadingWrap: { paddingHorizontal: 4, paddingTop: 16, paddingBottom: 4 },
  homeHeading: { fontSize: 24, lineHeight: 30, color: colors.dark, fontFamily: fonts.heading, letterSpacing: 0.2 },
  homeSubheading: { fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: fonts.base },
  mealTabsRow: { flexDirection: 'row', gap: 8, marginTop: 14, paddingHorizontal: 4 },
  mealTab: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  mealTabActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  mealTabText: { fontSize: 12, fontWeight: 'bold', color: colors.muted, fontFamily: fonts.baseBold },
  mealTabTextActive: { color: colors.white },
  regionRow: { marginTop: 10, paddingHorizontal: 4 },
  regionChip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, marginRight: 8 },
  regionChipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  regionChipText: { fontSize: 12, fontWeight: 'bold', color: colors.muted, fontFamily: fonts.baseBold },
  regionChipTextActive: { color: colors.white },
  cuisineChip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  cuisineChipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  cuisineChipSoon: { backgroundColor: colors.sand, borderColor: colors.border, borderStyle: 'dashed' },
  cuisineChipText: { fontSize: 11, fontWeight: '600', color: colors.muted, fontFamily: fonts.baseSemiBold },
  cuisineChipTextActive: { color: colors.white },
  circleRing: {
    width: 112, height: 112, borderRadius: 999, borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(30,107,78,0.35)', backgroundColor: colors.forestMist,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  circleImg: { width: '100%', height: '100%', borderRadius: 999 },
  circleLiveDot: {
    position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 999,
    backgroundColor: colors.forest, borderWidth: 2, borderColor: '#fff',
  },
  dishPhoto: { width: 112, height: 112, borderRadius: 999, backgroundColor: colors.sand },
  dishPhotoFallback: { alignItems: 'center', justifyContent: 'center' },
  dishName: { flex: 1, fontSize: 13, fontWeight: 'bold', color: colors.dark, textAlign: 'center', fontFamily: fonts.baseBold },
  dishKitchen: { fontSize: 11, color: colors.muted, marginTop: 2, fontFamily: fonts.base },
  dishIncludes: { fontSize: 10, color: colors.muted, marginTop: 2, lineHeight: 13, textAlign: 'center', minHeight: 26, fontFamily: fonts.base },
  ratingChip: { backgroundColor: colors.sand, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  ratingChipText: { fontSize: 10, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  servingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.forestMist, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  servingChipPre: { backgroundColor: colors.sand },
  servingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest },
  servingChipText: { fontSize: 10, fontWeight: 'bold', color: colors.forest, fontFamily: fonts.baseBold },
  servingChipTextPre: { color: colors.muted },
  dishPrice: { fontSize: 17, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.heading },
  addBtn: { backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8, elevation: 2 },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: 'bold', fontFamily: fonts.baseBold },
  vegDotBox: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#15803D', borderRadius: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  vegDotBoxNon: { borderColor: '#B91C1C' },
  vegDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D' },
  vegDotNon: { backgroundColor: '#B91C1C' },
  tiffinPlanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, elevation: 2 },
  tiffinPlanTitle: { fontSize: 15, fontWeight: 'bold', color: colors.dark, fontFamily: fonts.baseBold },
  tiffinPlanBody: { fontSize: 12, color: colors.muted, marginTop: 3, fontFamily: fonts.base },
  comingSoonCard: { marginTop: 14, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 24, alignItems: 'center' },
  comingSoonTitle: { fontSize: 16, fontWeight: 'bold', color: colors.dark, marginTop: 8, textAlign: 'center', fontFamily: fonts.baseBold },
  comingSoonBody: { fontSize: 12, color: colors.muted, marginTop: 4, textAlign: 'center', fontFamily: fonts.base },
  requestBtn: { backgroundColor: colors.forest, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 },
  requestBtnText: { color: colors.white, fontSize: 13, fontWeight: 'bold', fontFamily: fonts.baseBold },
});
