import { MMKV } from "react-native-mmkv";
import { FolderItem, List } from "../types";
import { getFolder, saveFolder, saveFolderItems } from "./folderStorage";
import { ListItem } from "../../../foundation/lists/types";

const storage = new MMKV();

const getListKey = (listId: string) => (`list_${listId}`);

const saveList = (list: List) =>
    storage.set(getListKey(list.id), JSON.stringify(list));

export const createList = (parentId: string, newListData: FolderItem) => {
    saveList({
        ...newListData,
        items: [],
        parentFolderId: parentId
    });
};

export const getList = (listId: string | undefined) => {
    if (!listId) return;
    const storageKey = getListKey(listId);

    // Fetch the list for the given id from MMKV storage
    const listString = storage.getString(storageKey);

    if (listString) {
        const foundList: List = JSON.parse(listString);

        return foundList;
    }
    return undefined;
};

export const updateList = (newData: FolderItem, newParentId?: string) => {
    const list = getList(newData.id);
    if (list) {
        const newList = {
            ...list,
            ...newData
        };
        if (newParentId) {
            newList.parentFolderId = newParentId;
            // Remove this list from its old parent
            const oldParentFolder = getFolder(list.parentFolderId);
            if (oldParentFolder) {
                saveFolder({
                    ...oldParentFolder,
                    items: oldParentFolder.items.filter(item => item.id !== newData.id)
                });
            }
            // Add this list to its new parent folder
            const parentFolder = getFolder(newParentId);
            if (parentFolder) {
                saveFolder({
                    ...parentFolder,
                    items: [...parentFolder.items, newData]
                });
            }
        }
        saveList(newList);
    }
};

export const deleteList = (listId: string) => {
    const list = getList(listId);
    if (list?.parentFolderId) {
        const parentFolder = getFolder(list.parentFolderId);
        if (parentFolder) {
            saveList({
                ...parentFolder,
                items: parentFolder.items.filter(item => item.id !== listId)
            });
        }
    }
    storage.delete(getListKey(listId));
};

// Special function that syncs a list's items with the sorted UI
export const saveListItems = (listId: string, newListItems: ListItem[]) => {
    const listKey = getListKey(listId);
    const list = getList(listId);
    if (list) {
        storage.set(
            listKey,
            JSON.stringify({
                ...list,
                items: newListItems
            })
        );

        const parentFolder = getFolder(list.parentFolderId);
        if (parentFolder) {
            const listIndex = parentFolder.items.findIndex(item => item.id === list.id);
            if (listIndex !== -1) {
                const newList = [...parentFolder.items];
                newList[listIndex].childrenCount = newListItems.length;
                saveFolderItems(parentFolder.id, newList);
            }
        }
    }
};