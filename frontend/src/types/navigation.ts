export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
}

export type MainTabParamList = {
    Home: undefined;
    Users: undefined;
    Category: undefined;
    Subcategory: undefined;
    Products: undefined;
    Profile: undefined;
};

export type UsersStackParamList = {
    UsersList: undefined;
    UserDetail: {userId: string};
    UsersCreate: undefined;
    UserEdit: {userId: string};
};

export type CategoryStackParamList = {
    CategoryList: undefined;
    CategoryDetail: {categoryId: string};
    CategoryCreate: undefined;
    CategoryEdit: {categoryId: string};
};

export type SubcategoryStackParamList = {
    SubcategoryList: undefined;
    SubcategoryDetail: {subcategoryId: string};
    SubcategoryCreate: undefined;
    SubcategoryEdit: {subcategoryId: string};
};

export type ProductStackParamList = {
    ProductList: undefined;
    ProductDetail: {productId: string};
    ProductCreate: undefined;
    ProductEdit: {productId: string};
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    ChangePassword: undefined;
    EditProfile: undefined;
}