import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  { path: '/warten', name: 'warten', component: () => import('@/views/WartenView.vue') },

  {
    path: '/',
    name: 'material',
    component: () => import('@/views/MaterialView.vue'),
    meta: { rolle: 'guest' },
  },
  {
    path: '/warenkorb',
    name: 'warenkorb',
    component: () => import('@/views/WarenkorbView.vue'),
    meta: { rolle: 'member' },
  },
  {
    path: '/bestellungen',
    name: 'bestellungen',
    component: () => import('@/views/BestellungenView.vue'),
    meta: { rolle: 'member' },
  },
  {
    path: '/bestellungen/:id',
    name: 'bestellung',
    component: () => import('@/views/BestellungDetailView.vue'),
    props: true,
    meta: { rolle: 'member' },
  },
  { path: '/profil', name: 'profil', component: () => import('@/views/ProfilView.vue') },

  {
    path: '/matchef',
    name: 'matchef',
    component: () => import('@/views/MatchefView.vue'),
    meta: { rolle: 'matchef' },
  },
  {
    path: '/admin/material/neu',
    name: 'material-neu',
    component: () => import('@/views/admin/MaterialEditView.vue'),
    meta: { rolle: 'matchef' },
  },
  {
    path: '/admin/material/:id',
    name: 'material-edit',
    component: () => import('@/views/admin/MaterialEditView.vue'),
    props: true,
    meta: { rolle: 'matchef' },
  },
  {
    path: '/admin/stammdaten',
    name: 'stammdaten',
    component: () => import('@/views/admin/StammdatenView.vue'),
    meta: { rolle: 'matchef' },
  },
  {
    path: '/admin/sammlungen',
    name: 'sammlungen',
    component: () => import('@/views/admin/SammlungenView.vue'),
    meta: { rolle: 'matchef' },
  },
  {
    path: '/admin/mitglieder',
    name: 'mitglieder',
    component: () => import('@/views/admin/MitgliederView.vue'),
    meta: { rolle: 'admin' },
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const s = useSessionStore()
  await s.ready
  if (to.meta.public) return
  if (!s.user) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.rolle && !s.hasRole(to.meta.rolle)) {
    return s.rolle === null || s.rolle === 'pending' ? { name: 'warten' } : { name: 'material' }
  }
})
