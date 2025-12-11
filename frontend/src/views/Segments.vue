<template>
  <CrudTable
    title="Segmentos"
    subtitle="Gerencie os segmentos de atendimento"
    :columns="columns"
    :items="segments"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteSegment"
  />

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
    <div class="modal-card p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Novo' }} Segmento</h3>
      <form @submit.prevent="saveSegment" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input v-model="form.name" type="text" required class="form-control w-full" />
        </div>
        <div class="flex space-x-3">
          <button type="button" @click="showModal = false" class="flex-1 btn-secondary">Cancelar</button>
          <button type="submit" class="flex-1 btn-primary text-center">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import CrudTable from '../components/common/CrudTable.vue'
import api from '../services/api'

const segments = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '' })

const columns = [
  { key: 'name', label: 'Nome' },
]

onMounted(() => loadSegments())
watch(search, () => loadSegments())

const loadSegments = async () => {
  const response = await api.get('/segments', { params: { search: search.value } })
  segments.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  form.value = item ? { ...item } : { name: '' }
  showModal.value = true
}

const saveSegment = async () => {
  try {
    if (editingItem.value) {
      await api.patch(`/segments/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/segments', form.value)
    }
    showModal.value = false
    loadSegments()
  } catch (error) {
    alert('Erro ao salvar segmento')
  }
}

const deleteSegment = async (item) => {
  if (confirm('Deseja realmente excluir este segmento?')) {
    await api.delete(`/segments/${item.id}`)
    loadSegments()
  }
}
</script>
