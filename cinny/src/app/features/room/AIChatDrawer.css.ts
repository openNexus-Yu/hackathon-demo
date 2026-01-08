import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';

export const AIChatDrawer = style({
    width: toRem(320),
});

export const AIChatDrawerHeader = style({
    flexShrink: 0,
    padding: `0 ${config.space.S200} 0 ${config.space.S300}`,
    borderBottomWidth: config.borderWidth.B300,
});

export const AIChatDrawerContentBase = style({
    position: 'relative',
    overflow: 'hidden',
});

export const AIChatDrawerContent = style({
    padding: `${config.space.S200} 0`,
});

export const MessagesGroup = style({
    paddingLeft: config.space.S200,
    paddingRight: config.space.S200,
});

export const MessageBubble = style({
    padding: config.space.S300,
    borderRadius: config.radii.R400,
    maxWidth: '85%',
});

export const UserMessageBubble = style([MessageBubble, {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--mx-hs-color)',
    color: 'var(--bg-surface-on)',
}]);

export const AssistantMessageBubble = style([MessageBubble, {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--bg-surface-low)',
}]);

export const InputArea = style({
    padding: config.space.S200,
    borderTopWidth: config.borderWidth.B300,
});
