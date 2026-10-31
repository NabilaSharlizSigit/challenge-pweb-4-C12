import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { getPagination, paginationMeta } from "../utils/pagination";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

export const createUser = async (req: Request, res: Response) => {
  const { email, name, password } = req.body ?? {};

  if (!email || !password) {
    throw new HttpError(400, "Email dan password wajib diisi");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HttpError(409, "Email sudah terdaftar");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 10),
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  sendSuccess(res, 201, "User berhasil dibuat", user);
};

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true } },
    },
  });

  sendSuccess(res, 200, "Berhasil mengambil data users", users);
};

export const getUserById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      posts: {
        select: { id: true, title: true, published: true, createdAt: true },
      },
    },
  });

  if (!user) throw new HttpError(404, "User tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil data user", user);
};

export const getUserPosts = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const published =
    req.query.published === undefined
      ? undefined
      : req.query.published === "true";

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) throw new HttpError(404, "User tidak ditemukan");

  const where = {
    authorId: id,
    ...(published !== undefined && { published }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil post milik user", posts, paginationMeta(page, limit, total));
};

export const updateUser = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { email, name } = req.body ?? {};

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email && { email }),
      ...(name && { name }),
    },
    select: { id: true, email: true, name: true, updatedAt: true },
  });

  sendSuccess(res, 200, "User berhasil diupdate", user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  await prisma.user.delete({ where: { id } });

  sendSuccess(res, 200, "User berhasil dihapus");
};
