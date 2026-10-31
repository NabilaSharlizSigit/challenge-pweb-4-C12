import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { getPagination, paginationMeta } from "../utils/pagination";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

const authorSelect = { select: { id: true, name: true, email: true } };

export const createPost = async (req: Request, res: Response) => {
  const { title, content, authorId } = req.body ?? {};

  if (!title || !authorId) {
    throw new HttpError(400, "Title dan authorId wajib diisi");
  }

  const author = await prisma.user.findUnique({
    where: { id: parseId(authorId) },
  });
  if (!author) throw new HttpError(404, "User tidak ditemukan");

  const post = await prisma.post.create({
    data: { title, content, authorId: author.id },
    include: { author: authorSelect },
  });

  sendSuccess(res, 201, "Post berhasil dibuat", post);
};

export const getAllPosts = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const published =
    req.query.published === undefined
      ? undefined
      : req.query.published === "true";

  const where = {
    ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    ...(published !== undefined && { published }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { author: authorSelect },
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data posts", posts, paginationMeta(page, limit, total));
};

export const getPostById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: authorSelect },
  });
  if (!post) throw new HttpError(404, "Post tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil data post", post);
};

export const updatePost = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { title, content, published } = req.body ?? {};

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content !== undefined && { content }),
      ...(published !== undefined && { published }),
    },
    include: { author: authorSelect },
  });

  sendSuccess(res, 200, "Post berhasil diupdate", post);
};

export const deletePost = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  await prisma.post.delete({ where: { id } });

  sendSuccess(res, 200, "Post berhasil dihapus");
};
