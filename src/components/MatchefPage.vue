<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase.js'
import { useRouter } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
  loading.value = false
  if (!data.session) {
    router.push('/login')
  }
  if (data.session.user.app_metadata.role !== 'matchef') {
    router.push('inventar')
  }
})

supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
  if (!_session) {
    router.push('/login')
  }
  if (_session && _session.user.app_metadata.role !== 'matchef') {
    router.push('inventar')
  }
})
</script>

<template></template>
