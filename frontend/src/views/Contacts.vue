<template>
  <CrudTable
    title="Contatos"
    subtitle="Gerencie os contatos do sistema"
    :columns="columns"
    :items="contacts"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteContact"
  />

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
    <div class="modal-card p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Novo' }} Contato</h3>
      <form @submit.prevent="saveContact" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input v-model="form.name" type="text" required class="form-control w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Telefone</label>
          <input v-model="form.phone" type="text" required class="form-control w-full" placeholder="5511999999999" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">CPF</label>
          <input v-model="form.cpf" type="text" class="form-control w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Contrato</label>
          <input v-model="form.contract" type="text" class="form-control w-full" />
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

const contacts = ref([])
const search = ref('')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ name: '', phone: '', cpf: '', contract: '' })

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'cpf', label: 'CPF' },
  { key: 'contract', label: 'Contrato' },
]

onMounted(() => loadContacts())
watch(search, () => loadContacts())

const loadContacts = async () => {
  const response = await api.get('/contacts', { params: { search: search.value } })
  contacts.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  form.value = item ? { ...item } : { name: '', phone: '', cpf: '', contract: '' }
  showModal.value = true
}

const saveContact = async () => {
  try {
    if (editingItem.value) {
      await api.patch(`/contacts/${editingItem.value.id}`, form.value)
    } else {
      await api.post('/contacts', form.value)
    }
    showModal.value = false
    loadContacts()
  } catch (error) {
    alert('Erro ao salvar contato')
  }
}

const deleteContact = async (item) => {
  if (confirm('Deseja realmente excluir este contato?')) {
    await api.delete(`/contacts/${item.id}`)
    loadContacts()
  }
}
</script>
