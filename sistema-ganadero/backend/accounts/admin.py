from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from .models import Usuario, Rol

# Deshabilitar Groups (no lo necesitamos, usamos roles personalizados)
admin.site.unregister(Group)


# ==========================================
# ADMIN PARA ROL
# ==========================================

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'descripcion')
    search_fields = ('nombre',)
    ordering = ('id',)
    
    def has_view_permission(self, request, obj=None):
        # Solo SUPER_ADMIN puede ver roles
        if hasattr(request.user, 'rol') and request.user.rol:
            return request.user.rol.nombre == 'SUPER_ADMIN'
        return request.user.is_superuser
    
    def has_add_permission(self, request):
        if hasattr(request.user, 'rol') and request.user.rol:
            return request.user.rol.nombre == 'SUPER_ADMIN'
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        if hasattr(request.user, 'rol') and request.user.rol:
            return request.user.rol.nombre == 'SUPER_ADMIN'
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        if hasattr(request.user, 'rol') and request.user.rol:
            return request.user.rol.nombre == 'SUPER_ADMIN'
        return request.user.is_superuser


# ==========================================
# ADMIN PARA USUARIO (PERSONALIZADO)
# ==========================================

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'get_rol', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'rol')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('id',)
    
    # Campos que se muestran en el formulario
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email')}),
        ('Rol y Permisos', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser')}),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos para crear nuevo usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'rol', 'is_staff', 'is_active'),
        }),
    )
    
    def get_rol(self, obj):
        return obj.rol.nombre if obj.rol else 'Sin rol'
    get_rol.short_description = 'Rol'
    get_rol.admin_order_field = 'rol__nombre'
    
    # ==========================================
    # CONTROLES DE PERMISO POR ROL
    # ==========================================
    
    def get_queryset(self, request):
        """Qué usuarios puede ver cada rol"""
        qs = super().get_queryset(request)
        
        if hasattr(request.user, 'rol') and request.user.rol:
            # VETERINARIO solo ve su propio usuario
            if request.user.rol.nombre == 'VETERINARIO':
                return qs.filter(id=request.user.id)
            # ADMIN_FINCA ve todos los usuarios excepto SUPER_ADMIN
            elif request.user.rol.nombre == 'ADMIN_FINCA':
                return qs.exclude(rol__nombre='SUPER_ADMIN')
        
        return qs
    
    def has_view_permission(self, request, obj=None):
        """Quién puede ver el listado de usuarios"""
        if not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'rol') and request.user.rol:
            # VETERINARIO solo ve su propio perfil
            if request.user.rol.nombre == 'VETERINARIO':
                return True
            # ADMIN_FINCA y SUPER_ADMIN pueden ver
            return request.user.rol.nombre in ['SUPER_ADMIN', 'ADMIN_FINCA']
        
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """Quién puede editar usuarios"""
        if not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'rol') and request.user.rol:
            # VETERINARIO solo puede editar su propio perfil
            if request.user.rol.nombre == 'VETERINARIO':
                return obj is None or obj.id == request.user.id
            # ADMIN_FINCA puede editar excepto SUPER_ADMIN
            elif request.user.rol.nombre == 'ADMIN_FINCA':
                if obj and obj.rol and obj.rol.nombre == 'SUPER_ADMIN':
                    return False
                return True
            # SUPER_ADMIN puede todo
            elif request.user.rol.nombre == 'SUPER_ADMIN':
                return True
        
        return request.user.is_superuser
    
    def has_add_permission(self, request):
        """Quién puede crear nuevos usuarios"""
        if hasattr(request.user, 'rol') and request.user.rol:
            # Solo ADMIN_FINCA y SUPER_ADMIN pueden crear
            return request.user.rol.nombre in ['SUPER_ADMIN', 'ADMIN_FINCA']
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        """Quién puede eliminar usuarios"""
        if hasattr(request.user, 'rol') and request.user.rol:
            # Solo SUPER_ADMIN puede eliminar
            if request.user.rol.nombre == 'SUPER_ADMIN':
                return True
            # ADMIN_FINCA no puede eliminar SUPER_ADMIN
            if request.user.rol.nombre == 'ADMIN_FINCA' and obj and obj.rol and obj.rol.nombre == 'SUPER_ADMIN':
                return False
            return False
        return request.user.is_superuser
    
    # ==========================================
    # GUARDAR USUARIO (sincronizar is_staff con rol)
    # ==========================================
    
    def save_model(self, request, obj, form, change):
        """Al guardar, sincronizar is_staff según el rol"""
        if obj.rol:
            if obj.rol.nombre == 'SUPER_ADMIN':
                obj.is_staff = True
                obj.is_superuser = True
            elif obj.rol.nombre in ['ADMIN_FINCA', 'VETERINARIO']:
                obj.is_staff = True
                obj.is_superuser = False
            else:
                obj.is_staff = False
                obj.is_superuser = False
        super().save_model(request, obj, form, change)