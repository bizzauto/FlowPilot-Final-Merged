import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { automationQueue } from "@/lib/queue";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "workflows.write");
  await rateLimit(`workflows:run:${ctx.session.user.id}`, 30, 60);

  const workflowId = context.params.id;

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      organizationId: ctx.organizationId,
    },
  });

  if (!workflow) {
    throw new ApiError(404, "Workflow not found", "NOT_FOUND");
  }

  let contact = await prisma.contact.findFirst({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        organizationId: ctx.organizationId,
        name: "Test Contact",
        stage: "NEW",
      },
    });
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      organizationId: ctx.organizationId,
      workflowId: workflow.id,
      contactId: contact.id,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  await automationQueue.add(
    "run-automation",
    {
      executionId: execution.id,
      stepIndex: 0,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );

  return NextResponse.json({ success: true, executionId: execution.id });
});