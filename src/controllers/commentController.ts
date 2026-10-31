import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { getPagination, paginationMeta } from "../utils/pagination";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

const commentInclude = {
  author: { select: { id: true, name: true } },
  post: { select: { id: true, title: true } },
};

export const createComment = async (req: Request, res: Response) => {
  const { content, postId, authorId } = req.body ?? {};

  if (!content || !postId || !authorId) {
    throw new HttpError(400, "Content, postId, dan authorId wajib diisi");
  }

  const [post, author] = await Promise.all([
    prisma.post.findUnique({ where: { id: parseId(postId) } }),
    prisma.user.findUnique({ where: { id: parseId(authorId) } }),
  ]);
  if (!post) throw new HttpError(404, "Post tidak ditemukan");
  if (!author) throw new HttpError(404, "User tidak ditemukan");

  const comment = await prisma.comment.create({
    data: { content, postId: post.id, authorId: author.id },
    include: commentInclude,
  });

  sendSuccess(res, 201, "Comment berhasil dibuat", comment);
};

export const getAllComments = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: commentInclude,
    }),
    prisma.comment.count(),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data comments", comments, paginationMeta(page, limit, total));
};

export const getCommentById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: commentInclude,
  });
  if (!comment) throw new HttpError(404, "Comment tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil data comment", comment);
};

export const updateComment = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { content } = req.body ?? {};

  if (!content) {
    throw new HttpError(400, "Content wajib diisi");
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: { content },
    include: commentInclude,
  });

  sendSuccess(res, 200, "Comment berhasil diupdate", comment);
};

export const deleteComment = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  await prisma.comment.delete({ where: { id } });

  sendSuccess(res, 200, "Comment berhasil dihapus");
};
