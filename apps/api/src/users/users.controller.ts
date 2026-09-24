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
}
