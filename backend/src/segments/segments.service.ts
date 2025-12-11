import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';

@Injectable()
export class SegmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createSegmentDto: CreateSegmentDto) {
    const existing = await this.prisma.segment.findUnique({
      where: { name: createSegmentDto.name },
    });

    if (existing) {
      throw new ConflictException('Segmento com este nome já existe');
    }

    return this.prisma.segment.create({
      data: createSegmentDto,
    });
  }

  async findAll(search?: string) {
    return this.prisma.segment.findMany({
      where: search ? {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      } : undefined,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      throw new NotFoundException(`Segmento com ID ${id} não encontrado`);
    }

    return segment;
  }

  async update(id: number, updateSegmentDto: UpdateSegmentDto) {
    await this.findOne(id);

    return this.prisma.segment.update({
      where: { id },
      data: updateSegmentDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.segment.delete({
      where: { id },
    });
  }
}
