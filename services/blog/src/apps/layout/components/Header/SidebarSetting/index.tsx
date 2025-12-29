import HeaderSettingBtn from '@/assets/icons/header-setting-btn.svg?react'

import * as Styled from './index.style'
import { useSidebarSetting } from './useSidebarSetting'
import { Modal, Spacer, Text } from '@vallista/design-system'
import { FONT_SIZES } from '../utils'

export const SidebarSetting = () => {
  const { dialog, changeDialogVisible, changeREM, textSize } = useSidebarSetting()

  return (
    <>
      <button
        className={dialog.visible ? Styled.buttonActive : Styled.button}
        onClick={() => changeDialogVisible('SETTING')}
      >
        <HeaderSettingBtn />
      </button>
      <Modal active={dialog.visible} onClose={() => changeDialogVisible('SETTING')}>
        <div>
          <Text size={20} weight={600}>
            설정
          </Text>
          <Spacer y={2} />
          <div className={Styled.environmentContainer}>
            <Text weight={500}>텍스트 크기</Text>
            <div className={Styled.selectGaugeWrapper}>
              {FONT_SIZES.map((it, idx, arr) => (
                <div
                  key={idx}
                  className={textSize === it ? Styled.selectGaugeSelected : Styled.selectGauge}
                  style={{ left: `${(idx / (arr.length - 1)) * 100}%`, top: '50%' }}
                  onClick={() => changeREM(it)}
                  data-value={it}
                />
              ))}
            </div>
          </div>
          <Spacer y={2} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => changeDialogVisible('SETTING')}>
              <Text>닫기</Text>
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
