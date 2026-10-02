import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AsistenteService } from './asistente.service';
import { PreguntarDto } from './dto/preguntar.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Asistente')
@Controller('asistente')
export class AsistenteController {
  constructor(private readonly asistenteService: AsistenteService) {}

  @Post('preguntar')
  @Public()
  @ApiOperation({ summary: 'Preguntar al asistente (público, respuestas acotadas)' })
  @ApiResponse({ status: 201, description: 'Respuesta del asistente con fuentes' })
  @ApiResponse({ status: 400, description: 'Pregunta vacía o muy larga' })
  preguntar(@Body() dto: PreguntarDto) {
    return this.asistenteService.preguntar(dto.pregunta);
  }
}