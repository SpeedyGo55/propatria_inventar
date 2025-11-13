import './assets/main.css'
import 'vue-final-modal/style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVfm } from 'vue-final-modal'

import App from './App.vue'
import LoginPage from '@/components/LoginPage.vue'
import InventarPage from '@/components/InventarPage.vue'
import ReservationsPage from '@/components/ReservationsPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'inventar', component: InventarPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/reservations', name: 'reservations', component: ReservationsPage },
    { path: '/profile', name: 'profile', component: ProfilePage },
  ],
})

const app = createApp(App)

const vfm = createVfm()

app.use(router)
app.use(vfm)
app.mount('#app')
