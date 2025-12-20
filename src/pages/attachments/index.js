import { apiGet, apiPost, apiDelete } from '../../services/http.js'
import { getUserId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

export default {
  components:{ Layout },
  data() {
    return {
      attached_to_type:'task', 
      attached_to_id:'', 
      file_name:'', 
      storage_key:'', 
      content_type:'image/png', 
      file_size:0, 
      attachments:[] 
    }
  },
  onShow() { 
    this.fetch() 
  },
  methods: {
    async fetch() {
       const res = await apiGet('/attachments/', this.attached_to_id ? { attached_to_type: this.attached_to_type, attached_to_id: this.attached_to_id } : undefined); 
       if (res.statusCode === 200) {
        this.attachments = res.data.data || [] 
      }
    },
    
    async upload() {
      if (!this.attached_to_id || !this.file_name || !this.storage_key) {
        uni.showToast({ title:'请填写信息', icon:'none' }); 
        return
      } 
      const res = await apiPost(
        '/attachments/', 
        {
          owner_id: getUserId(),
          attached_to_type: this.attached_to_type, 
          attached_to_id: this.attached_to_id, 
          file_name: this.file_name, 
          file_size: this.file_size || 0,
          content_type: this.content_type, 
          storage_key: this.storage_key, 
          attachment_type: 'file',
          metadata: {}
        }
      ); 
      if (res.statusCode === 200 ){
        this.reset();
        this.fetch();
        uni.showToast({ title:'已添加', icon:'success' }) 
      } 
    },

    async remove(id) { 
      const res = await apiDelete(`/attachments/${id}/`, {}); 
      if (res.statusCode === 200) this.fetch() 
    },
    previewUrl(a) { return a.storage_key },
    isImage(ct) { return (ct || '').startsWith('image/') },
    reset() { 
      this.file_name=''; 
      this.storage_key=''; 
      this.content_type='image/png'; 
      this.file_size=0 
    }
  }
}
