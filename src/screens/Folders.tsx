import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { FolderItemType } from '../feature/folders/enums';
import SortableFolder from '../feature/folders/components/SortableFolder';
import SortableList from '../feature/folders/components/SortableList';

interface PageConfig {
  id: string;
  type: FolderItemType;
}

const Folders = () => {
  const { colors } = useTheme();
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    id: 'root',
    type: FolderItemType.FOLDER
  });

  const onBackClick = (parentFolderId: string) =>
    setPageConfig({ id: parentFolderId, type: FolderItemType.FOLDER });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView key={pageConfig.id}>
        {pageConfig.type === FolderItemType.FOLDER ? (
          <SortableFolder
            folderId={pageConfig.id}
            onBackClick={onBackClick}
            onOpenItem={(id: string, type: FolderItemType) =>
              setPageConfig({ id, type })
            }
          />
        ) : (
          <SortableList
            listId={pageConfig.id}
            onBackClick={onBackClick}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default Folders;