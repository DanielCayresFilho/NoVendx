<template>
  <CrudTable
    title="Linhas WhatsApp"
    subtitle="Gerencie as linhas de atendimento"
    :columns="columns"
    :items="lines"
    v-model:search="search"
    @new="openModal()"
    @edit="openModal"
    @delete="deleteLine"
  >
    <template #cell-lineStatus="{ item }">
      <span :class="[
        'px-2 py-1 rounded-full text-xs font-medium',
        item.lineStatus === 'active' ? 'bg-success bg-opacity-20 text-success' : 'bg-error bg-opacity-20 text-error'
      ]">
        {{ item.lineStatus === 'active' ? 'Ativa' : 'Banida' }}
      </span>
    </template>

    <template #cell-oficial="{ item }">
      <span :class="[
        'px-2 py-1 rounded-full text-xs font-medium',
        item.oficial ? 'bg-whatsapp bg-opacity-20 text-whatsapp' : 'bg-gray-200 text-gray-600'
      ]">
        {{ item.oficial ? 'Oficial' : 'Evolution' }}
      </span>
    </template>
  </CrudTable>

  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto px-4">
    <div class="modal-card p-6 w-full max-w-md my-8">
      <h3 class="text-xl font-bold mb-4">{{ editingItem ? 'Editar' : 'Nova' }} Linha</h3>
      <form @submit.prevent="saveLine" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Telefone</label>
          <input v-model="form.phone" type="text" required class="form-control w-full" placeholder="5511999999999" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Segmento</label>
          <select v-model="form.segment" class="form-control w-full">
            <option :value="null">Nenhum</option>
            <option v-for="seg in segments" :key="seg.id" :value="seg.id">{{ seg.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Evolution</label>
          <select v-model="form.evolutionName" required class="form-control w-full">
            <option value="">Selecione</option>
            <option v-for="evo in evolutions" :key="evo.id" :value="evo.evolutionName">{{ evo.evolutionName }}</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <input v-model="form.oficial" type="checkbox" id="oficial" class="w-4 h-4" />
          <label for="oficial" class="text-sm font-medium">WhatsApp Oficial (Cloud API)</label>
        </div>

        <div v-if="form.oficial" class="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="block text-sm font-medium mb-2">Token</label>
            <input v-model="form.token" type="text" class="form-control w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Business ID</label>
            <input v-model="form.businessID" type="text" class="form-control w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Number ID</label>
            <input v-model="form.numberId" type="text" class="form-control w-full" />
          </div>
        </div>

        <div class="flex space-x-3">
          <button type="button" @click="showModal = false" class="flex-1 btn-secondary">Cancelar</button>
          <button type="submit" class="flex-1 btn-primary text-center">Salvar</button>
        </div>
      </form>

      <div v-if="editingItem && !editingItem.oficial" class="mt-4 pt-4 border-t">
        <button
          @click="getQRCode"
          class="w-full bg-whatsapp text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center justify-center space-x-2"
        >
          <i class="fas fa-qrcode"></i>
          <span>Ver QR Code</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Modal QR Code -->
  <div v-if="showQRModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="modal-card p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold">QR Code - {{ editingItem?.phone }}</h3>
        <button
          @click="closeQRModal"
          class="text-gray-400 hover:text-gray-600"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div v-if="qrCode" class="text-center">
        <div class="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
          <img 
            :src="getQRCodeSrc(qrCode)" 
            alt="QR Code" 
            class="w-64 h-64 object-contain"
            @error="handleImageError"
          />
        </div>
        <p class="text-sm text-textSecondary mb-2">
          <i class="fas fa-mobile-alt mr-2"></i>
          Escaneie este QR Code com seu WhatsApp
        </p>
        <div class="bg-blue-50 p-3 rounded-lg text-xs text-left space-y-1">
          <p><strong>1.</strong> Abra o WhatsApp no celular</p>
          <p><strong>2.</strong> Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></p>
          <p><strong>3.</strong> Toque em <strong>Aparelhos conectados</strong></p>
          <p><strong>4.</strong> Toque em <strong>Conectar um aparelho</strong></p>
          <p><strong>5.</strong> Aponte o celular para esta tela para escanear o QR Code</p>
        </div>
      </div>
      
      <div v-else-if="qrError" class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-error mb-4"></i>
        <p class="text-error font-medium mb-2">Erro ao carregar QR Code</p>
        <p class="text-sm text-textSecondary mb-4">{{ qrError }}</p>
        <button
          @click="retryQRCode"
          class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary"
        >
          Tentar novamente
        </button>
      </div>
      
      <div v-else class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
        <p class="text-sm text-textSecondary">Carregando QR Code...</p>
      </div>
      
      <button
        @click="closeQRModal"
        class="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
      >
        Fechar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import CrudTable from '../components/common/CrudTable.vue'
import api from '../services/api'

const lines = ref([])
const segments = ref([])
const evolutions = ref([])
const search = ref('')
const showModal = ref(false)
const showQRModal = ref(false)
const qrCode = ref(null)
const qrError = ref(null)
const editingItem = ref(null)
const form = ref({
  phone: '',
  segment: null,
  evolutionName: '',
  oficial: false,
  token: '',
  businessID: '',
  numberId: '',
})

const columns = [
  { key: 'phone', label: 'Telefone' },
  { key: 'lineStatus', label: 'Status' },
  { key: 'oficial', label: 'Tipo' },
  { key: 'evolutionName', label: 'Evolution' },
]

onMounted(async () => {
  await loadLines()
  const [segResponse, evoResponse] = await Promise.all([
    api.get('/segments'),
    api.get('/evolution')
  ])
  segments.value = segResponse.data
  evolutions.value = evoResponse.data
})

watch(search, () => loadLines())

const loadLines = async () => {
  const response = await api.get('/lines', { params: { search: search.value } })
  lines.value = response.data
}

const openModal = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      phone: '',
      segment: null,
      evolutionName: '',
      oficial: false,
      token: '',
      businessID: '',
      numberId: '',
    }
  }
  showModal.value = true
}

const saveLine = async () => {
  try {
    // Preparar dados para envio - converter strings vazias em null
    const dataToSend = {
      ...form.value,
      token: form.value.token?.trim() || null,
      businessID: form.value.businessID?.trim() || null,
      numberId: form.value.numberId?.trim() || null,
    }

    console.log('📤 Enviando dados para criar linha:', dataToSend)

    if (editingItem.value) {
      await api.patch(`/lines/${editingItem.value.id}`, dataToSend)
    } else {
      await api.post('/lines', dataToSend)
    }
    showModal.value = false
    loadLines()
  } catch (error) {
    console.error('❌ Erro completo:', error)
    console.error('❌ Resposta do servidor:', error.response?.data)
    alert('Erro ao salvar linha: ' + (error.response?.data?.message || error.message))
  }
}

const deleteLine = async (item) => {
  if (confirm('Deseja realmente excluir esta linha?')) {
    await api.delete(`/lines/${item.id}`)
    loadLines()
  }
}

const getQRCode = async () => {
  try {
    showQRModal.value = true
    qrCode.value = null
    qrError.value = null
    const response = await api.get(`/lines/${editingItem.value.id}/qrcode`)
    qrCode.value = response.data
  } catch (error) {
    console.error('Erro ao obter QR Code:', error)
    qrError.value = error.response?.data?.message || error.message || 'Não foi possível carregar o QR Code'
  }
}

const getQRCodeSrc = (qrData) => {
  // Se já tiver o prefixo data:image, retorna direto
  if (qrData.qrcode?.startsWith('data:image')) {
    return qrData.qrcode
  }
  // Se for base64 sem prefixo, adiciona
  if (qrData.qrcode && !qrData.qrcode.startsWith('http')) {
    return `data:image/png;base64,${qrData.qrcode}`
  }
  // Se for URL, retorna direto
  return qrData.qrcode || qrData.base64 || ''
}

const handleImageError = (event) => {
  console.error('Erro ao carregar imagem do QR Code:', event)
  qrError.value = 'Não foi possível exibir a imagem do QR Code'
}

const closeQRModal = () => {
  showQRModal.value = false
  qrCode.value = null
  qrError.value = null
}

const retryQRCode = () => {
  qrError.value = null
  getQRCode()
}
</script>
