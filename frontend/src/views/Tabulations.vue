<template>
  <CrudTable
    title="Tabulações"
    subtitle="Gerencie as tabulações de conversas"
    :columns="columns"
    :items="tabulations"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteTabulation"
  >
    <template #cell-isCPC="{ item }">
      <span :class="[
        'px-2 py-1 rounded-full text-xs font-medium',
        item.isCPC ? 'bg-success bg-opacity-20 text-success' : 'bg-gray-200 text-gray-600'
      ]">
        {{ item.isCPC ? 'Sim' : 'Não' }}
      </span>
    </template>
  </CrudTable>

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Nova' }} Tabulação</h3>
      <form @submit.prevent="saveTabulation" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input v-model="form.name" type="text" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary" />
        </div>
        <div class="flex items-center space-x-2">
          <input v-model="form.isCPC" type="checkbox" id="isCPC" class="w-4 h-4" />
          <label for="isCPC" class="text-sm font-medium">É CPC</label>
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
import { ref, onMounted, watch } from 'vue'
import CrudTable from '../components/common/CrudTable.vue'
import api from '../services/api'

const tabulations = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', isCPC: false })

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'isCPC', label: 'CPC' },
]

onMounted(() => loadTabulations())
watch(search, () => loadTabulations())

const loadTabulations = async () => {
  const response = await api.get('/tabulations', { params: { search: search.value } })
  tabulations.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  form.value = item ? { ...item } : { name: '', isCPC: false }
  showModal.value = true
}

const saveTabulation = async () => {
  try {
    if (editingItem.value) {
      await api.patch(`/tabulations/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/tabulations', form.value)
    }
    showModal.value = false
    loadTabulations()
  } catch (error) {
    alert('Erro ao salvar tabulação')
  }
}

const deleteTabulation = async (item) => {
  if (confirm('Deseja realmente excluir esta tabulação?')) {
    await api.delete(`/tabulations/${item.id}`)
    loadTabulations()
  }
}
</script>
