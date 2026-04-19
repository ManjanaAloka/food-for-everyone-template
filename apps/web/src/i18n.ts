import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: {
        appName: 'Food for Everyone',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        donationCenters: 'Donation Centers',
        impact: 'Impact',
        newListing: 'New Listing',
        providerDashboard: 'Provider Dashboard',
        admin: 'Admin',
        adminReviews: 'Reviews',
        cart: 'Cart',
        myOrders: 'My Orders',
        search: 'Search',
        addToCart: 'Add to cart',
        expires: 'Expires',
        checkout: 'Checkout',
        placeOrder: 'Place order',
        personal: 'Personal',
        donation: 'Donation',
        pickup: 'Pickup',
        delivery: 'Delivery',
        onlinePayment: 'Online',
        cod: 'Cash on Delivery',
        donationCenter: 'Donation Center',
        status: 'Status',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        rating: 'Rating',
        comment: 'Comment'
      }
    }
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  debug: false,
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
