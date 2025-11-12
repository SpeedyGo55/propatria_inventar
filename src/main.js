import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import LoginPage from '@/components/LoginPage.vue'
import InventarPage from '@/components/InventarPage.vue'
import ReservationsPage from '@/components/ReservationsPage.vue'


const router = createRouter({
  history: createWebHistory(),
  routes:[
    { path: '/', name: 'inventar', component: InventarPage},
    { path: '/login', name: 'login', component: LoginPage},
    { path: '/reservations', name: 'reservations', component: ReservationsPage},
  ]
});


const app= createApp(App)

app.use(router)

app.mount('#app')
