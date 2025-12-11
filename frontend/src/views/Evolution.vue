<template>
  <CrudTable
    title="Evolution API"
    subtitle="Configure as instâncias da Evolution API"
    :columns="columns"
    :items="evolutions"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteEvolution"
  />

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Nova' }} Evolution</h3>
      <form @submit.prevent="saveEvolution" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input v-model="form.evolutionName" type="text" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" placeholder="Evolution Local" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">URL</label>
          <input v-model="form.evolutionUrl" type="url" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" placeholder="http://localhost:8080" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">API Key</label>
          <input v-model="form.evolutionKey" type="text" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div class="flex space-x-3">
          <button type="button" @click="showModal = false" class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button type="submit" class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CrudTable from '../components/common/CrudTable.vue'
import api from '../services/api'

const evolutions = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ evolutionName: '', evolutionUrl: '', evolutionKey: '' })

const columns = [
  { key: 'evolutionName', label: 'Nome' },
  { key: 'evolutionUrl', label: 'URL' },
]

onMounted(() => loadEvolutions())

const loadEvolutions = async () => {
  const response = await api.get('/evolution')
  evolutions.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  form.value = item ? { ...item } : { evolutionName: '', evolutionUrl: '', evolutionKey: '' }
  showModal.value = true
}

const saveEvolution = async () => {
  try {
    if (editingItem.value) {
      await api.patch(`/evolution/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/evolution', form.value)
    }
    showModal.value = false
    loadEvolutions()
  } catch (error) {
    alert('Erro ao salvar Evolution: ' + (error.response?.data?.message || error.message))
  }
}

const deleteEvolution = async (item) => {
  if (confirm('Deseja realmente excluir esta Evolution?')) {
    await api.delete(`/evolution/${item.id}`)
    loadEvolutions()
  }
}
</script>
