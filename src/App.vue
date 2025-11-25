<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
    <HeaderBar />
    <router-view class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '@/utils/supabase.js'
import HeaderBar from './components/HeaderBar.vue'
const session = ref()

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})
</script>
