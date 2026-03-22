export const createCommentSchema = {
  parse: (body: any) => {
    if (!body || typeof body.content !== 'string') throw new Error('Content is required and must be a string');
    const content = body.content.trim();
    if (content.length < 1) throw new Error('Comment cannot be empty');
    if (content.length > 2000) throw new Error('Comment is too long');

    let parentId = undefined;
    if (body.parentId !== undefined && body.parentId !== null) {
        if (typeof body.parentId === 'number' || typeof body.parentId === 'string') {
            parentId = body.parentId;
        } else {
            throw new Error('parentId must be a number or string');
        }
    }

    return { content, parentId };
  }
};

export const updateCommentSchema = {
  parse: (body: any) => {
    if (!body || typeof body.content !== 'string') throw new Error('Content is required and must be a string');
    const content = body.content.trim();
    if (content.length < 1) throw new Error('Comment cannot be empty');
    if (content.length > 2000) throw new Error('Comment is too long');

    return { content };
  }
};
