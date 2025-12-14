import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await argon2.hash(createUserDto.password);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll(filters?: any) {
    // Remover campos inválidos que não existem no schema
    const { search, ...validFilters } = filters || {};
    
    // Se houver busca por texto, aplicar filtros
    const where = search 
      ? {
          ...validFilters,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : validFilters;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        segment: true,
        line: true,
        status: true,
        oneToOneActive: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar password
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    // Limpar campos vazios
    const cleanData: any = { ...updateUserDto };
    
    // Remover password se estiver vazio/undefined
    if (!cleanData.password || cleanData.password === '') {
      delete cleanData.password;
    } else {
      // Hash da senha apenas se foi fornecida
      cleanData.password = await argon2.hash(cleanData.password);
    }

    // Converter strings vazias para null nos campos numéricos opcionais
    if (cleanData.segment === '' || cleanData.segment === undefined) {
      cleanData.segment = null;
    }
    if (cleanData.line === '' || cleanData.line === undefined) {
      cleanData.line = null;
    }

    // Garantir que oneToOneActive seja boolean (não undefined se não foi enviado)
    if (cleanData.oneToOneActive === undefined) {
      // Se não foi enviado, não alterar (manter valor atual)
      delete cleanData.oneToOneActive;
    } else {
      // Garantir que seja boolean
      cleanData.oneToOneActive = Boolean(cleanData.oneToOneActive);
    }

    console.log('💾 Dados limpos para atualizar:', cleanData);

    return this.prisma.user.update({
      where: { id },
      data: cleanData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        segment: true,
        line: true,
        status: true,
        oneToOneActive: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar password
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getOnlineOperators(segment?: number) {
    return this.prisma.user.findMany({
      where: {
        role: 'operator',
        status: 'Online',
        ...(segment && { segment }),
      },
    });
  }
}
