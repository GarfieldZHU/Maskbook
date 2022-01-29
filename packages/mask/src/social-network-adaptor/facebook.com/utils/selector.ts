import { LiveSelector } from '@dimensiondev/holoflows-kit'

type E = HTMLElement

const querySelector = <T extends E, SingleMode extends boolean = true>(selector: string, singleMode = true) => {
    const ls = new LiveSelector<T, SingleMode>().querySelector<T>(selector)
    return (singleMode ? ls.enableSingleMode() : ls) as LiveSelector<T, SingleMode>
}

export const searchAvatarSelector: () => LiveSelector<E, true> = () => querySelector<E>('[href="/me/"] image')

export const searchNickNameSelector: () => LiveSelector<E, true> = () => querySelector<E>('[href="/me/"] span > span')

export const bioDescriptionSelector = () =>
    querySelector('[role="main"] h1').closest(5).querySelector<HTMLSpanElement>('span > span')

// #endregion facebook nft avatar

export const searchFacebookAvatarListSelector = () =>
    querySelector('[role="dialog"] input[type=file]').closest(3).querySelector('div')

export const searchFacebookAvatarOpenFilesSelector = () => querySelector('[role="dialog"] input[type=file] ~ div')

export const searchFacebookSaveAvatarButtonSelector = () =>
    new LiveSelector()
        .querySelector('[role="dialog"] [aria-pressed="false"]')
        .closest<HTMLDivElement>(4)
        .querySelectorAll('div')
        .map((x) => x.parentElement?.parentElement)
        .at(-1)

export const searchFacebookConfirmAvatarImageSelector = () =>
    querySelector('[role="dialog"] [aria-pressed="false"]').closest<HTMLDivElement>(4).querySelector('img')
// #region
