import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AssignPermisoDto } from './dto/assign-permiso.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AssignUsuarioPermisosDto } from './dto/assign-usuario-permisos.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Seguridad')
@Controller('seguridad')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('roles')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get('roles/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol encontrado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findRolById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findRolById(id);
  }

  @Post('roles')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado' })
  @ApiResponse({ status: 409, description: 'Rol ya existe' })
  async createRol(@Body() dto: CreateRolDto, @CurrentUser() usuario: AuthenticatedUser) {
    return this.usersService.createRol(dto, usuario);
  }

  @Patch('roles/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  async updateRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.updateRol(id, dto, usuario);
  }

  @Delete('roles/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiResponse({ status: 200, description: 'Rol eliminado' })
  @ApiResponse({ status: 409, description: 'Rol tiene usuarios asignados' })
  async deleteRol(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.deleteRol(id, usuario);
  }

  @Patch('roles/:id/permisos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar permisos a un rol' })
  @ApiResponse({ status: 200, description: 'Permisos asignados' })
  async assignPermisoToRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermisoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.assignPermisoToRol(id, dto, usuario);
  }

  @Get('permisos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los permisos disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de permisos' })
  async findAllPermisos() {
    return this.usersService.findAllPermisos();
  }

  @Get('usuarios')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios, opcionalmente filtrados por rol' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAllUsuarios(@Query('rol') rol?: string) {
    return this.usersService.findAllUsuarios(rol);
  }

  @Get('usuarios/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario con su rol y excepciones de permisos' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findUsuarioById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findUsuarioById(id);
  }

  @Post('usuarios')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un usuario/empleado' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'CUI o correo ya registrados' })
  createUsuario(
    @Body() dto: CreateUsuarioDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.createUsuario(dto, usuario);
  }

  @Patch('usuarios/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar rol y/o estado de un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario o rol no encontrados' })
  updateUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.updateUsuario(id, dto, usuario);
  }

  @Patch('usuarios/:id/permisos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar excepciones de permisos individuales a un usuario' })
  @ApiResponse({ status: 200, description: 'Permisos asignados' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  assignUsuarioPermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUsuarioPermisosDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.usersService.assignUsuarioPermisos(id, dto, usuario);
  }
}
